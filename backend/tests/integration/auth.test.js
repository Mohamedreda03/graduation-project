const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { User, RefreshToken } = require('../../src/models');
const { ROLES } = require('../../src/config/constants');

describe('Authentication API Integration Tests', () => {
  let adminUser;
  let doctorUser;
  let studentUser;
  const password = 'password123';

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      password: password,
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN,
      isActive: true
    });

    doctorUser = await User.create({
      email: 'doctor@test.com',
      password: password,
      name: { first: 'Doctor', last: 'User' },
      role: ROLES.DOCTOR,
      isActive: true
    });

    studentUser = await User.create({
      email: 'student@test.com',
      studentId: '20210001',
      password: password,
      name: { first: 'Student', last: 'User' },
      role: ROLES.STUDENT,
      isActive: true
    });
  });

  describe('POST /api/auth/web/login', () => {
    it('should login successfully for admin and set cookies', async () => {
      const res = await request(app)
        .post('/api/auth/web/login')
        .send({ email: adminUser.email, password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(adminUser.email);
      
      // Check cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies.some(c => c.includes('accessToken'))).toBe(true);
      expect(cookies.some(c => c.includes('refreshToken'))).toBe(true);
    });

    it('should login successfully for doctor and set cookies', async () => {
      const res = await request(app)
        .post('/api/auth/web/login')
        .send({ email: doctorUser.email, password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.role).toBe(ROLES.DOCTOR);
    });

    it('should reject login for student on web endpoint', async () => {
      const res = await request(app)
        .post('/api/auth/web/login')
        .send({ email: studentUser.email, password });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/web/login')
        .send({ email: adminUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/mobile/login', () => {
    const deviceInfo = {
      macAddress: 'AA:BB:CC:DD:EE:FF',
      deviceId: 'unique-device-id'
    };

    it('should login successfully for student and return tokens in body', async () => {
      const res = await request(app)
        .post('/api/auth/mobile/login')
        .send({ 
          studentId: studentUser.studentId, 
          password,
          deviceInfo
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.studentId).toBe(studentUser.studentId);
      
      // Verify device binding
      const updatedStudent = await User.findById(studentUser._id);
      expect(updatedStudent.device.macAddress).toBe(deviceInfo.macAddress);
      expect(updatedStudent.device.isVerified).toBe(true);
    });

    it('should reject login if device MAC address mismatch', async () => {
      // First login to bind device
      await request(app)
        .post('/api/auth/mobile/login')
        .send({ studentId: studentUser.studentId, password, deviceInfo });

      // Second login with different MAC
      const res = await request(app)
        .post('/api/auth/mobile/login')
        .send({ 
          studentId: studentUser.studentId, 
          password,
          deviceInfo: { macAddress: '00:11:22:33:44:55', deviceId: 'another-id' }
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('مسجل على جهاز آخر');
    });
  });

  describe('POST /api/auth/web/refresh', () => {
    it('should refresh tokens using valid refresh cookie', async () => {
      // Login first to get cookies
      const loginRes = await request(app)
        .post('/api/auth/web/login')
        .send({ email: adminUser.email, password });

      // Filter out empty cookies (cleared cookies)
      const cookies = loginRes.headers['set-cookie']
        .filter(cookie => !cookie.includes('accessToken=;') && !cookie.includes('refreshToken=;'))
        .map(cookie => cookie.split(';')[0]);
      
      const res = await request(app)
        .post('/api/auth/web/refresh')
        .set('Cookie', cookies);

      if (res.statusCode !== 200) console.log('Refresh Token Error:', res.body, 'Cookies Sent:', cookies);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie'].some(c => c.includes('accessToken'))).toBe(true);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password for authenticated user', async () => {
      // Login first
      const loginRes = await request(app)
        .post('/api/auth/mobile/login')
        .send({ studentId: studentUser.studentId, password, deviceInfo: { macAddress: 'AA:BB' } });
      
      const token = loginRes.body.data.accessToken;
      const newPassword = 'newpassword123';

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          currentPassword: password, 
          newPassword, 
          confirmPassword: newPassword 
        });

      if (res.statusCode !== 200) console.log('Change Password Error:', res.body);
      expect(res.statusCode).toBe(200);
      
      // Verify login with new password
      // Wait 1s to ensure JWT iat is different to avoid duplicate refreshToken
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const loginRes2 = await request(app)
        .post('/api/auth/mobile/login')
        .send({ studentId: studentUser.studentId, password: newPassword, deviceInfo: { macAddress: 'AA:BB' } });
      
      if (loginRes2.statusCode !== 200) console.log('Login with New Password Error:', loginRes2.body);
      expect(loginRes2.statusCode).toBe(200);
    });
  });
});

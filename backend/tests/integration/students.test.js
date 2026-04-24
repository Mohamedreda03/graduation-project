const request = require('supertest');
const app = require('../../src/app');
const { User, Department, Course } = require('../../src/models');
const { ROLES, DEVICE_REQUEST_STATUS } = require('../../src/config/constants');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/env');

describe('Students API Integration Tests', () => {
  let adminToken;
  let adminUser;
  let studentUser;
  let department;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN,
      isActive: true
    });

    department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      faculty: 'Engineering'
    });

    studentUser = await User.create({
      email: 'student@test.com',
      studentId: '20210001',
      password: 'password123',
      name: { first: 'Student', last: 'User' },
      role: ROLES.STUDENT,
      academicInfo: {
        department: department._id,
        level: 3
      },
      isActive: true
    });

    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  });

  describe('GET /api/students/stats', () => {
    it('should return student statistics', async () => {
      const res = await request(app)
        .get('/api/students/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.levels['3']).toBe(1);
    });
  });

  describe('GET /api/students', () => {
    it('should return all students', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].studentId).toBe('20210001');
    });

    it('should filter students by level', async () => {
      const res = await request(app)
        .get('/api/students?level=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should return empty if level does not match', async () => {
      const res = await request(app)
        .get('/api/students?level=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/students', () => {
    it('should create a new student', async () => {
      const newStudent = {
        email: 'newstudent@test.com',
        studentId: '20210002',
        password: 'password123',
        name: { first: 'New', last: 'Student' },
        academicInfo: {
          department: department._id,
          level: 1
        }
      };

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newStudent);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.studentId).toBe('20210002');
    });
  });

  describe('POST /api/students/bulk', () => {
    it('should create multiple students at once', async () => {
      const bulkData = {
        students: [
          {
            email: 'bulk1@test.com',
            studentId: '20210003',
            password: 'password123',
            name: { first: 'Bulk1', last: 'User' }
          },
          {
            email: 'bulk2@test.com',
            studentId: '20210004',
            password: 'password123',
            name: { first: 'Bulk2', last: 'User' }
          }
        ]
      };

      const res = await request(app)
        .post('/api/students/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.success).toHaveLength(2);
    });
  });

  describe('Device Change Requests', () => {
    it('should submit a device change request', async () => {
      const studentToken = jwt.sign({ id: studentUser._id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const requestData = {
        reason: 'Lost my old phone',
        newDeviceInfo: {
          macAddress: 'EE:FF:GG:HH:II:JJ',
          deviceName: 'Samsung S21'
        }
      };

      const res = await request(app)
        .post('/api/students/request-device-change')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(requestData);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('successfully');

      const updatedStudent = await User.findById(studentUser._id);
      expect(updatedStudent.deviceChangeRequest.requested).toBe(true);
      expect(updatedStudent.deviceChangeRequest.status).toBe(DEVICE_REQUEST_STATUS.PENDING);
    });

    it('should approve a device change request', async () => {
      // Setup a pending request
      studentUser.deviceChangeRequest = {
        requested: true,
        requestedAt: new Date(),
        reason: 'Test reason',
        newDeviceInfo: { macAddress: 'NEW:MAC:ADDRESS', deviceId: 'new-id' },
        status: DEVICE_REQUEST_STATUS.PENDING
      };
      await studentUser.save();

      const res = await request(app)
        .post(`/api/students/device-requests/${studentUser._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const updatedStudent = await User.findById(studentUser._id);
      expect(updatedStudent.device.macAddress).toBe('NEW:MAC:ADDRESS');
      expect(updatedStudent.deviceChangeRequest.requested).toBe(false);
      expect(updatedStudent.deviceChangeRequest.status).toBe(DEVICE_REQUEST_STATUS.APPROVED);
    });
  });
});

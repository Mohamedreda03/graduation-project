const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const { ROLES } = require('../../src/config/constants');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/env');

describe('Users API Integration Tests', () => {
  let adminToken;
  let adminUser;
  let otherUser;
  let staffUser;
  let staffToken;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN,
      isActive: true
    });

    otherUser = await User.create({
      email: 'other@test.com',
      password: 'password123',
      name: { first: 'Other', last: 'User' },
      role: ROLES.DOCTOR,
      isActive: true
    });

    staffUser = await User.create({
      email: 'staff@test.com',
      password: 'password123',
      name: { first: 'Staff', last: 'User' },
      role: ROLES.ADMIN,
      adminRole: 'student_affairs',
      isActive: true
    });

    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    staffToken = jwt.sign({ id: staffUser._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  });

  describe('GET /api/users/me', () => {
    it('should return the current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(adminUser.email);
      expect(res.body.data.name).toBe('Admin User');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/users?role=doctor')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe(otherUser.email);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'new@test.com',
        password: 'password123',
        name: { first: 'New', last: 'User' },
        role: ROLES.DOCTOR
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.email).toBe(newUser.email);
      
      const userInDb = await User.findOne({ email: newUser.email });
      expect(userInDb).toBeDefined();
    });

    it('should not allow non-super-admin to create an admin user', async () => {
      const newAdmin = {
        email: 'newadmin@test.com',
        password: 'password123',
        name: { first: 'New', last: 'Admin' },
        role: ROLES.ADMIN,
        adminRole: 'dean'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(newAdmin);

      expect(res.statusCode).toBe(403);
    });

    it('should allow super-admin to create an admin user', async () => {
      const newAdmin = {
        email: 'newadmin@test.com',
        password: 'password123',
        name: { first: 'New', last: 'Admin' },
        role: ROLES.ADMIN,
        adminRole: 'dean'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAdmin);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.adminRole).toBe('dean');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user details', async () => {
      const updateData = { name: { first: 'Updated', last: 'Name' } };

      const res = await request(app)
        .put(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name.first).toBe('Updated');
    });

    it('should not allow non-super-admin to modify an admin user', async () => {
      const updateData = { name: { first: 'Updated', last: 'AdminName' } };

      const res = await request(app)
        .put(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(403);
    });

    it('should allow super-admin to modify an admin user and hash password if provided', async () => {
      const updateData = { 
        name: { first: 'Updated', last: 'AdminName' },
        password: 'newpassword123'
      };

      const res = await request(app)
        .put(`/api/users/${staffUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name.first).toBe('Updated');

      const updatedUser = await User.findById(staffUser._id).select('+password');
      const isMatch = await updatedUser.comparePassword('newpassword123');
      expect(isMatch).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should deactivate a user instead of hard deleting', async () => {
      const res = await request(app)
        .delete(`/api/users/${otherUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const deactivatedUser = await User.findById(otherUser._id);
      expect(deactivatedUser.isActive).toBe(false);
    });

    it('should not allow non-super-admin to deactivate an admin user', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow super-admin to deactivate an admin user', async () => {
      const res = await request(app)
        .delete(`/api/users/${staffUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      
      const deactivatedUser = await User.findById(staffUser._id);
      expect(deactivatedUser.isActive).toBe(false);
    });
  });
});

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

    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, {
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
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
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
  });
});

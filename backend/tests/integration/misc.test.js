const request = require('supertest');
const app = require('../../src/app');
const { User, Setting, Department, Course, Lecture } = require('../../src/models');
const { ROLES } = require('../../src/config/constants');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/env');
const aiService = require('../../src/services/ai.service');

// Mock AI Service to avoid real API calls
jest.mock('../../src/services/ai.service');

describe('Miscellaneous API Integration Tests (Settings, Doctors, AI)', () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN
    });
    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, { expiresIn: '1h' });
  });

  describe('Settings API', () => {
    it('should initialize and list settings', async () => {
      // Initialize
      const resInit = await request(app)
        .post('/api/settings/initialize')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(resInit.statusCode).toBe(200);
      expect(resInit.body.data.created).toContain('MIN_PRESENCE_PERCENTAGE');

      // List
      const resList = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(resList.statusCode).toBe(200);
      expect(resList.body.data.MIN_PRESENCE_PERCENTAGE.value).toBe(85);
    });

    it('should update a setting', async () => {
      const res = await request(app)
        .put('/api/settings/MIN_PRESENCE_PERCENTAGE')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: 90 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.value).toBe(90);
    });
  });

  describe('Doctors API', () => {
    let doctor;
    let dept;

    beforeEach(async () => {
      dept = await Department.create({ name: 'CS', code: 'CS', faculty: 'Eng' });
      doctor = await User.create({
        email: 'doc@test.com',
        password: 'password123',
        name: { first: 'Doc', last: 'User' },
        role: ROLES.DOCTOR,
        academicInfo: { department: dept._id }
      });
    });

    it('should list doctors with filters', async () => {
      const res = await request(app)
        .get('/api/doctors?search=Doc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should assign courses to a doctor', async () => {
      const course = await Course.create({
        name: 'Test', code: 'T1', department: dept._id, doctor: adminUser._id, level: 1, semester: '1'
      });

      const res = await request(app)
        .post(`/api/doctors/${doctor._id}/courses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ courses: [course._id] });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.assigned).toBe(1);

      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse.doctor.toString()).toBe(doctor._id.toString());
    });
  });

  describe('AI API', () => {
    it('should return AI response (mocked)', async () => {
      aiService.chat.mockResolvedValue('Mocked AI Response');

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ messages: [{ role: 'user', content: 'Hello' }] });

      expect(res.statusCode).toBe(200);
      expect(res.body.content).toBe('Mocked AI Response');
    });

    it('should return error for invalid messages', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ messages: 'invalid' });

      expect(res.statusCode).toBe(400);
    });
  });
});

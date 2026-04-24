const request = require('supertest');
const app = require('../../src/app');
const { User, Department, Course, Hall, Lecture, AttendanceRecord } = require('../../src/models');
const { ROLES } = require('../../src/config/constants');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/env');
const { getTodayDate } = require('../../src/utils/helpers');

describe('Dashboard API Integration Tests', () => {
  let adminToken;

  beforeEach(async () => {
    // Setup Admin
    const adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN
    });
    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, { expiresIn: '1h' });

    // Seed some data for stats
    const dept = await Department.create({ name: 'CS', code: 'CS', faculty: 'Eng' });
    const doctor = await User.create({
      email: 'doc@test.com',
      password: 'password123',
      name: { first: 'Doc', last: 'User' },
      role: ROLES.DOCTOR
    });
    const student = await User.create({
      email: 'student@test.com',
      password: 'password123',
      name: { first: 'Stu', last: 'User' },
      role: ROLES.STUDENT
    });
    const course = await Course.create({
      name: 'Test Course',
      code: 'TC101',
      department: dept._id,
      doctor: doctor._id,
      level: 1,
      semester: 'Fall'
    });
    const hall = await Hall.create({ name: 'Hall 1', building: 'B1', isActive: true });
    
    // Create today's lecture
    await Lecture.create({
      course: course._id,
      hall: hall._id,
      doctor: doctor._id,
      dayOfWeek: new Date().getDay(),
      startTime: '08:00',
      endTime: '10:00'
    });

    // Create finalized attendance
    await AttendanceRecord.create({
      student: student._id,
      course: course._id,
      lecture: (await Lecture.findOne())._id,
      hall: hall._id,
      date: getTodayDate(),
      status: 'present',
      isFinalized: true
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return combined statistics for admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalStudents).toBe(1);
      expect(res.body.data.totalDoctors).toBe(1);
      expect(res.body.data.activeLectures).toBe(1);
      expect(res.body.data.todayAttendance.present).toBe(1);
    });
  });

  describe('GET /api/dashboard/health', () => {
    it('should return system health status', async () => {
      const res = await request(app)
        .get('/api/dashboard/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.database).toBe('healthy');
    });
  });

  describe('GET /api/dashboard/activities', () => {
    it('should return recent activities', async () => {
      const res = await request(app)
        .get('/api/dashboard/activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('attendance');
    });
  });
});

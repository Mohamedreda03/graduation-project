const request = require('supertest');
const app = require('../../src/app');
const { User, Department, Course, Hall, Lecture } = require('../../src/models');
const { ROLES } = require('../../src/config/constants');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/env');

describe('Academic API Integration Tests', () => {
  let adminToken;
  let adminUser;
  let doctorUser;
  let department;
  let hall;

  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN,
      isActive: true
    });

    doctorUser = await User.create({
      email: 'doctor@test.com',
      password: 'password123',
      name: { first: 'Doctor', last: 'User' },
      role: ROLES.DOCTOR,
      isActive: true
    });

    department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      faculty: 'Engineering'
    });

    hall = await Hall.create({
      name: 'Hall 101',
      building: 'Main Building',
      capacity: 50
    });

    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  });

  describe('Departments API', () => {
    it('should create and list departments', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should update a department', async () => {
      const res = await request(app)
        .put(`/api/departments/${department._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'CS - Updated' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('CS - Updated');
    });
  });

  describe('Courses API', () => {
    let course;

    beforeEach(async () => {
      course = await Course.create({
        name: 'Algorithms',
        code: 'CS301',
        department: department._id,
        doctor: doctorUser._id,
        level: 3,
        semester: 'Fall 2025'
      });
    });

    it('should list courses with filters', async () => {
      const res = await request(app)
        .get('/api/courses?level=3')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should add students to a course', async () => {
      const student = await User.create({
        email: 's1@test.com',
        studentId: '20210001',
        password: 'password123',
        name: { first: 'S1', last: 'User' },
        role: ROLES.STUDENT
      });

      const res = await request(app)
        .post(`/api/courses/${course._id}/students`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ students: [student._id] });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.addedCount).toBe(1);

      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse.students).toContainEqual(student._id);
    });
  });

  describe('Lectures API', () => {
    let course;

    beforeEach(async () => {
      course = await Course.create({
        name: 'Database',
        code: 'CS302',
        department: department._id,
        doctor: doctorUser._id,
        level: 3,
        semester: 'Fall 2025'
      });
    });

    it('should schedule a lecture and detect conflicts', async () => {
      const lectureData = {
        course: course._id,
        hall: hall._id,
        dayOfWeek: 1, // Monday
        startTime: '08:00',
        endTime: '10:00'
      };

      const res = await request(app)
        .post('/api/lectures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(lectureData);

      expect(res.statusCode).toBe(201);

      // Try to schedule a conflicting lecture
      const res2 = await request(app)
        .post('/api/lectures')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: course._id,
          hall: hall._id,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '11:00'
        });

      expect(res2.statusCode).toBe(409);
    });

    it('should start and end a lecture', async () => {
      const lecture = await Lecture.create({
        course: course._id,
        hall: hall._id,
        doctor: doctorUser._id,
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '12:00'
      });

      const resStart = await request(app)
        .post(`/api/lectures/${lecture._id}/start`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resStart.statusCode).toBe(200);
      expect(resStart.body.data.status).toBe('in-progress');

      const resEnd = await request(app)
        .post(`/api/lectures/${lecture._id}/end`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resEnd.statusCode).toBe(200);
      expect(resEnd.body.data.status).toBe('completed');
    });
  });
});

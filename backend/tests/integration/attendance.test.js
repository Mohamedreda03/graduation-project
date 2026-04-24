const request = require('supertest');
const app = require('../../src/app');
const { User, Department, Course, Hall, Lecture, AttendanceRecord, StudentSession } = require('../../src/models');
const { ROLES, CONNECTION_EVENTS, ATTENDANCE_STATUS } = require('../../src/config/constants');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/env');
const { getTodayDate, getCurrentTimeString } = require('../../src/utils/helpers');

describe('Attendance API Integration Tests', () => {
  let adminToken;
  let doctorToken;
  let studentUser;
  let doctorUser;
  let department;
  let hall;
  let course;
  let lecture;

  beforeEach(async () => {
    // Setup Admin
    const adminUser = await User.create({
      email: 'admin@test.com',
      password: 'password123',
      name: { first: 'Admin', last: 'User' },
      role: ROLES.ADMIN
    });
    adminToken = jwt.sign({ id: adminUser._id }, config.jwt.secret, { expiresIn: '1h' });

    // Setup Doctor
    doctorUser = await User.create({
      email: 'doctor@test.com',
      password: 'password123',
      name: { first: 'Doctor', last: 'User' },
      role: ROLES.DOCTOR
    });
    doctorToken = jwt.sign({ id: doctorUser._id }, config.jwt.secret, { expiresIn: '1h' });

    // Setup Department
    department = await Department.create({ name: 'CS', code: 'CS', faculty: 'Eng' });

    // Setup Student
    studentUser = await User.create({
      email: 'student@test.com',
      studentId: '20210001',
      password: 'password123',
      name: { first: 'Student', last: 'User' },
      role: ROLES.STUDENT,
      device: { macAddress: 'AA:BB:CC:DD:EE:FF', isVerified: true }
    });

    // Setup Hall with AP
    hall = await Hall.create({
      name: 'Lab 1',
      building: 'B1',
      accessPoint: {
        ssid: 'Hall-WiFi',
        apIdentifier: 'AP-001',
        apiKey: 'hall-secret-key'
      }
    });

    // Setup Course
    course = await Course.create({
      name: 'Networking',
      code: 'CS401',
      department: department._id,
      doctor: doctorUser._id,
      level: 4,
      semester: 'Spring 2026',
      students: [studentUser._id]
    });

    // Setup Lecture
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startHour = now.getHours();
    const endHour = (startHour + 2) % 24;
    
    lecture = await Lecture.create({
      course: course._id,
      hall: hall._id,
      doctor: doctorUser._id,
      dayOfWeek: dayOfWeek,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
      status: 'in-progress'
    });
  });

  describe('AP Connection Events', () => {
    it('should record attendance when student connects to AP during lecture', async () => {
      const res = await request(app)
        .post('/api/connections/event')
        .set('x-api-key', 'hall-secret-key')
        .send({
          eventType: CONNECTION_EVENTS.CONNECTED,
          macAddress: 'AA:BB:CC:DD:EE:FF',
          apIdentifier: 'AP-001',
          timestamp: new Date()
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('processed');

      // Verify AttendanceRecord was created
      const record = await AttendanceRecord.findOne({
        student: studentUser._id,
        lecture: lecture._id
      });
      expect(record).toBeDefined();
      expect(record.status).toBe(ATTENDANCE_STATUS.IN_PROGRESS);

      // Verify StudentSession was created
      const session = await StudentSession.findOne({
        student: studentUser._id,
        isActive: true
      });
      expect(session).toBeDefined();
      expect(session.currentHall.toString()).toBe(hall._id.toString());
    });

    it('should close session when student disconnects', async () => {
      // First connect
      await request(app)
        .post('/api/connections/event')
        .set('x-api-key', 'hall-secret-key')
        .send({
          eventType: CONNECTION_EVENTS.CONNECTED,
          macAddress: 'AA:BB:CC:DD:EE:FF',
          apIdentifier: 'AP-001'
        });

      // Then disconnect
      const res = await request(app)
        .post('/api/connections/event')
        .set('x-api-key', 'hall-secret-key')
        .send({
          eventType: CONNECTION_EVENTS.DISCONNECTED,
          macAddress: 'AA:BB:CC:DD:EE:FF',
          apIdentifier: 'AP-001'
        });

      expect(res.statusCode).toBe(200);

      const session = await StudentSession.findOne({ student: studentUser._id });
      expect(session.isActive).toBe(false);
      
      const record = await AttendanceRecord.findOne({ student: studentUser._id });
      expect(record.status).toBe(ATTENDANCE_STATUS.PRESENT);
    });
  });

  describe('Manual Attendance Management', () => {
    it('should allow doctor to update attendance status', async () => {
      const record = await AttendanceRecord.create({
        student: studentUser._id,
        lecture: lecture._id,
        course: course._id,
        hall: hall._id,
        date: getTodayDate(),
        status: ATTENDANCE_STATUS.ABSENT
      });

      const res = await request(app)
        .put(`/api/attendance/${record._id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'present', reason: 'Student was late but arrived' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('present');
    });

    it('should return 403 if student tries to update attendance', async () => {
      const studentToken = jwt.sign({ id: studentUser._id }, config.jwt.secret, { expiresIn: '1h' });
      const record = await AttendanceRecord.create({
        student: studentUser._id,
        lecture: lecture._id,
        course: course._id,
        hall: hall._id,
        date: getTodayDate()
      });

      const res = await request(app)
        .put(`/api/attendance/${record._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'present' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Attendance Reporting', () => {
    it('should return attendance summary for student', async () => {
      await AttendanceRecord.create({
        student: studentUser._id,
        lecture: lecture._id,
        course: course._id,
        hall: hall._id,
        date: getTodayDate(),
        status: 'present',
        isFinalized: true
      });

      const studentToken = jwt.sign({ id: studentUser._id }, config.jwt.secret, { expiresIn: '1h' });
      const res = await request(app)
        .get('/api/attendance/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});

/**
 * Mobile API Integration Tests
 * Tests for all /api/mobile/* endpoints
 *
 * NOTE: Tokens are generated directly via jwt.sign() to avoid the rate-limiter
 * on the /api/auth/mobile/login endpoint. The device binding is set manually
 * on the student document to simulate a logged-in device.
 */

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../../src/app");
const { User, Course, Lecture, Hall, Specialization, AttendanceRecord } =
  require("../../src/models");
const { ROLES } = require("../../src/config/constants");
const config = require("../../src/config/env");

// ─────────────────────────────────────────────
const PASSWORD = "password123";
const MAC_ADDRESS = "AA:BB:CC:DD:EE:FF";

/** Generate a JWT token for a user (bypasses rate-limiter) */
function makeToken(userId) {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn || "1d",
  });
}

// ─────────────────────────────────────────────
describe("Mobile API Integration Tests (/api/mobile)", () => {
  let token;
  let student;
  let specialization;
  let hall;
  let course1;
  let course2;
  let doctor;
  let lecture1; // today's lecture
  let lecture2; // another day

  beforeEach(async () => {
    // 1. Specialization
    specialization = await Specialization.create({
      name: "هندسة الاتصالات",
      code: "COMM",
      faculty: "كلية الهندسة",
    });

    // 2. Hall
    hall = await Hall.create({
      name: "مدرج أ",
      building: "مبنى 1",
      capacity: 100,
    });

    // 3. Doctor
    doctor = await User.create({
      email: "doctor.mobile@uni.edu",
      password: PASSWORD,
      name: { first: "محمد", last: "العالم" },
      role: ROLES.DOCTOR,
      isActive: true,
    });

    // 4. Courses
    course1 = await Course.create({
      name: "هياكل البيانات",
      code: "CS201",
      specialization: specialization._id,
      doctor: doctor._id,
      level: 2,
      semester: "Fall 2025",
    });
    course2 = await Course.create({
      name: "قواعد البيانات",
      code: "CS301",
      specialization: specialization._id,
      doctor: doctor._id,
      level: 2,
      semester: "Fall 2025",
    });

    // 5. Student – device bound & verified (simulates post-login state)
    const todayDow = new Date().getDay();
    student = await User.create({
      email: "mobile.student@uni.edu",
      studentId: "20230099",
      password: PASSWORD,
      name: { first: "أحمد", last: "كريم" },
      role: ROLES.STUDENT,
      isActive: true,
      academicInfo: {
        specialization: specialization._id,
        level: 2,
        enrolledCourses: [course1._id, course2._id],
      },
      device: {
        macAddress: MAC_ADDRESS,
        deviceId: "test-device-001",
        isVerified: true,
        registeredAt: new Date(),
      },
    });

    // 6. Lectures
    lecture1 = await Lecture.create({
      course: course1._id,
      hall: hall._id,
      doctor: doctor._id,
      dayOfWeek: todayDow,
      startTime: "09:00",
      endTime: "11:00",
      lectureType: "lecture",
      isActive: true,
    });

    const anotherDow = (todayDow + 1) % 7;
    lecture2 = await Lecture.create({
      course: course2._id,
      hall: hall._id,
      doctor: doctor._id,
      dayOfWeek: anotherDow,
      startTime: "13:00",
      endTime: "15:00",
      lectureType: "section",
      isActive: true,
    });

    // 7. Finalized attendance record for course1
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await AttendanceRecord.create({
      student: student._id,
      lecture: lecture1._id,
      course: course1._id,
      hall: hall._id,
      date: today,
      status: "present",
      totalPresenceTime: 100,
      lectureTime: 120,
      presencePercentage: 83,
      isFinalized: true,
    });

    // 8. Generate JWT directly (no rate-limiter hit)
    token = makeToken(student._id);
  });

  // ─────────────────────────────────────────────
  // Screen 2 – Home
  // ─────────────────────────────────────────────
  describe("GET /api/mobile/home", () => {
    it("should return 200 with required home screen fields", async () => {
      const res = await request(app)
        .get("/api/mobile/home")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toHaveProperty("studentName");
      expect(data).toHaveProperty("todayLecturesCount");
      expect(data).toHaveProperty("todayDateFormatted");
      expect(data).toHaveProperty("dayNameAr");
      expect(data).toHaveProperty("liveLecture");
      expect(data).toHaveProperty("todaySchedule");
      expect(data).toHaveProperty("nextLecture");
      expect(Array.isArray(data.todaySchedule)).toBe(true);
    });

    it("should return the correct student first name", async () => {
      const res = await request(app)
        .get("/api/mobile/home")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.studentName).toBe(student.name.first);
    });

    it("should show today lectures count >= 1", async () => {
      const res = await request(app)
        .get("/api/mobile/home")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.todayLecturesCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.todaySchedule.length).toBeGreaterThanOrEqual(1);
    });

    it("should include proper fields in todaySchedule items", async () => {
      const res = await request(app)
        .get("/api/mobile/home")
        .set("Authorization", `Bearer ${token}`);

      const { todaySchedule } = res.body.data;
      if (todaySchedule.length > 0) {
        const item = todaySchedule[0];
        expect(item).toHaveProperty("lectureId");
        expect(item).toHaveProperty("courseName");
        expect(item).toHaveProperty("hallName");
        expect(item).toHaveProperty("startTime");
        expect(item).toHaveProperty("endTime");
        expect(item).toHaveProperty("isLive");
        expect(item).toHaveProperty("lectureType");
      }
    });

    it("should return dayNameAr in Arabic", async () => {
      const res = await request(app)
        .get("/api/mobile/home")
        .set("Authorization", `Bearer ${token}`);

      const VALID_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
      expect(VALID_DAYS).toContain(res.body.data.dayNameAr);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/mobile/home");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Screen 3 – Weekly Schedule
  // ─────────────────────────────────────────────
  describe("GET /api/mobile/schedule", () => {
    it("should return 200 with 6-day Egyptian academic week", async () => {
      const res = await request(app)
        .get("/api/mobile/schedule")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.days)).toBe(true);
      expect(res.body.data.days.length).toBe(6);
    });

    it("should have complete day structure with Arabic names", async () => {
      const res = await request(app)
        .get("/api/mobile/schedule")
        .set("Authorization", `Bearer ${token}`);

      for (const day of res.body.data.days) {
        expect(day).toHaveProperty("dayOfWeek");
        expect(day).toHaveProperty("dayNameAr");
        expect(day).toHaveProperty("date");
        expect(day).toHaveProperty("dateFormatted");
        expect(day).toHaveProperty("isToday");
        expect(day).toHaveProperty("lectures");
        expect(Array.isArray(day.lectures)).toBe(true);
      }
    });

    it("should include Saturday (dayOfWeek=6) named السبت", async () => {
      const res = await request(app)
        .get("/api/mobile/schedule")
        .set("Authorization", `Bearer ${token}`);

      const sat = res.body.data.days.find((d) => d.dayOfWeek === 6);
      expect(sat).toBeDefined();
      expect(sat.dayNameAr).toBe("السبت");
    });

    it("should mark today's day with isToday=true", async () => {
      const res = await request(app)
        .get("/api/mobile/schedule")
        .set("Authorization", `Bearer ${token}`);

      const todayDow = new Date().getDay();
      const todayDay = res.body.data.days.find((d) => d.dayOfWeek === todayDow);
      if (todayDay) {
        expect(todayDay.isToday).toBe(true);
      }
    });

    it("should list lecture1 on today's day", async () => {
      const res = await request(app)
        .get("/api/mobile/schedule")
        .set("Authorization", `Bearer ${token}`);

      const todayDow = new Date().getDay();
      const todayDay = res.body.data.days.find((d) => d.dayOfWeek === todayDow);
      if (todayDay) {
        expect(todayDay.lectures.length).toBeGreaterThanOrEqual(1);
        const found = todayDay.lectures.find(
          (l) => l.lectureId.toString() === lecture1._id.toString(),
        );
        expect(found).toBeDefined();
      }
    });

    it("should include dateFormatted in Arabic format (day month year)", async () => {
      const res = await request(app)
        .get("/api/mobile/schedule")
        .set("Authorization", `Bearer ${token}`);

      const day = res.body.data.days[0];
      // e.g. "19 أبريل 2025"
      expect(day.dateFormatted).toMatch(/^\d+ \S+ \d{4}$/);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/mobile/schedule");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Screen 4 – Attendance Summary
  // ─────────────────────────────────────────────
  describe("GET /api/mobile/attendance/summary", () => {
    it("should return 200 with courses dropdown and selected stats", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("courses");
      expect(res.body.data).toHaveProperty("selected");
      expect(Array.isArray(res.body.data.courses)).toBe(true);
    });

    it("should have correct fields in selected course stats", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/summary")
        .set("Authorization", `Bearer ${token}`);

      const { selected } = res.body.data;
      expect(selected).toHaveProperty("courseId");
      expect(selected).toHaveProperty("courseCode");
      expect(selected).toHaveProperty("courseName");
      expect(selected).toHaveProperty("totalLectures");
      expect(selected).toHaveProperty("attendedCount");
      expect(selected).toHaveProperty("absentCount");
      expect(selected).toHaveProperty("attendancePercentage");
      expect(selected).toHaveProperty("alert");
    });

    it("should have alert with valid level", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/summary")
        .set("Authorization", `Bearer ${token}`);

      const { alert } = res.body.data.selected;
      expect(alert).toHaveProperty("shouldAlert");
      expect(alert).toHaveProperty("level");
      expect(["safe", "warning", "danger"]).toContain(alert.level);
    });

    it("should filter by courseId and reflect correct attendance stats", async () => {
      const res = await request(app)
        .get(`/api/mobile/attendance/summary?courseId=${course1._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      const { selected } = res.body.data;
      expect(selected.courseId.toString()).toBe(course1._id.toString());
      expect(selected.totalLectures).toBe(1);
      expect(selected.attendedCount).toBe(1);
      expect(selected.absentCount).toBe(0);
      expect(selected.attendancePercentage).toBe(100);
      expect(selected.alert.level).toBe("safe");
    });

    it("should list 2 enrolled courses in dropdown", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.courses.length).toBe(2);
    });

    it("should show 0 attended for course with no records", async () => {
      const res = await request(app)
        .get(`/api/mobile/attendance/summary?courseId=${course2._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.selected.totalLectures).toBe(0);
      expect(res.body.data.selected.attendancePercentage).toBe(0);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/mobile/attendance/summary");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Screen 5 – Attendance History
  // ─────────────────────────────────────────────
  describe("GET /api/mobile/attendance/history", () => {
    it("should return 200 with courses, logs, and pagination", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/history")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("courses");
      expect(res.body.data).toHaveProperty("logs");
      expect(res.body.data).toHaveProperty("pagination");
      expect(Array.isArray(res.body.data.courses)).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it("should include 'كل المواد' as first course option", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/history")
        .set("Authorization", `Bearer ${token}`);

      const first = res.body.data.courses[0];
      expect(first.courseName).toBe("كل المواد");
      expect(first.courseId).toBe("all");
    });

    it("should return log with Arabic status and statusLevel", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/history")
        .set("Authorization", `Bearer ${token}`);

      const { logs } = res.body.data;
      expect(logs.length).toBeGreaterThanOrEqual(1);

      const log = logs[0];
      expect(log).toHaveProperty("recordId");
      expect(log).toHaveProperty("dateFormatted");
      expect(log).toHaveProperty("courseCode");
      expect(log).toHaveProperty("courseName");
      expect(log).toHaveProperty("status");
      expect(log).toHaveProperty("statusArabic");
      expect(log).toHaveProperty("statusLevel");
      expect(["حضور", "غياب", "متأخر", "مقبول", "جارية"]).toContain(log.statusArabic);
      expect(["success", "danger", "warning", "info"]).toContain(log.statusLevel);
    });

    it("should filter by courseId correctly", async () => {
      const res = await request(app)
        .get(`/api/mobile/attendance/history?courseId=${course1._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      for (const log of res.body.data.logs) {
        expect(log.courseCode).toBe(course1.code);
      }
    });

    it("should return empty logs for course with no records", async () => {
      const res = await request(app)
        .get(`/api/mobile/attendance/history?courseId=${course2._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.logs.length).toBe(0);
    });

    it("should paginate correctly", async () => {
      const res = await request(app)
        .get("/api/mobile/attendance/history?page=1&limit=5")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/mobile/attendance/history");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Screen 6 – Profile
  // ─────────────────────────────────────────────
  describe("GET /api/mobile/profile", () => {
    it("should return 200 with all profile fields", async () => {
      const res = await request(app)
        .get("/api/mobile/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("firstName");
      expect(data).toHaveProperty("studentId");
      expect(data).toHaveProperty("email");
      expect(data).toHaveProperty("specialization");
      expect(data).toHaveProperty("level");
      expect(data).toHaveProperty("enrolledCourses");
      expect(data).toHaveProperty("device");
      expect(data).toHaveProperty("deviceChangeRequest");
    });

    it("should have correct student identity info", async () => {
      const res = await request(app)
        .get("/api/mobile/profile")
        .set("Authorization", `Bearer ${token}`);

      const { data } = res.body;
      expect(data.studentId).toBe(student.studentId);
      expect(data.firstName).toBe(student.name.first);
      expect(data.level).toBe(2);
    });

    it("should show device as registered and verified", async () => {
      const res = await request(app)
        .get("/api/mobile/profile")
        .set("Authorization", `Bearer ${token}`);

      const { device } = res.body.data;
      expect(device.isRegistered).toBe(true);
      expect(device.isVerified).toBe(true);
      expect(device.macAddress).toBe(MAC_ADDRESS);
      expect(device.statusText).toBe("معتمد");
      expect(device.statusLevel).toBe("success");
    });

    it("should include 2 enrolled courses", async () => {
      const res = await request(app)
        .get("/api/mobile/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.enrolledCourses.length).toBe(2);
    });

    it("should have deviceChangeRequest as null initially", async () => {
      const res = await request(app)
        .get("/api/mobile/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(res.body.data.deviceChangeRequest).toBeNull();
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/mobile/profile");
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Device Change Request
  // ─────────────────────────────────────────────
  describe("POST /api/mobile/device-change-request", () => {
    const validBody = {
      reason: "فقدت هاتفي القديم واشتريت هاتف جديد",
      newDeviceInfo: {
        macAddress: "11:22:33:44:55:66",
        deviceName: "Samsung Galaxy S24",
      },
    };

    it("should submit request successfully", async () => {
      const res = await request(app)
        .post("/api/mobile/device-change-request")
        .set("Authorization", `Bearer ${token}`)
        .send(validBody);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeTruthy();
    });

    it("should reject if reason is missing", async () => {
      const res = await request(app)
        .post("/api/mobile/device-change-request")
        .set("Authorization", `Bearer ${token}`)
        .send({ newDeviceInfo: { macAddress: "11:22:33:44:55:66" } });

      expect(res.statusCode).toBe(400);
    });

    it("should reject if newDeviceInfo.macAddress is missing", async () => {
      const res = await request(app)
        .post("/api/mobile/device-change-request")
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "فقدان الهاتف", newDeviceInfo: { deviceName: "Samsung" } });

      expect(res.statusCode).toBe(400);
    });

    it("should reject a duplicate pending request", async () => {
      await request(app)
        .post("/api/mobile/device-change-request")
        .set("Authorization", `Bearer ${token}`)
        .send(validBody);

      const res2 = await request(app)
        .post("/api/mobile/device-change-request")
        .set("Authorization", `Bearer ${token}`)
        .send(validBody);

      expect(res2.statusCode).toBe(400);
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/mobile/device-change-request")
        .send(validBody);
      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // Role Protection
  // ─────────────────────────────────────────────
  describe("Role protection – non-students blocked", () => {
    it("should block admin from /api/mobile/home with 403", async () => {
      const admin = await User.create({
        email: "admin.mobile.test@uni.edu",
        password: PASSWORD,
        name: { first: "Admin", last: "Test" },
        role: ROLES.ADMIN,
        isActive: true,
      });
      const adminToken = makeToken(admin._id);

      const res = await request(app)
        .get("/api/mobile/home")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("should block doctor from /api/mobile/profile with 403", async () => {
      const doctorToken = makeToken(doctor._id);

      const res = await request(app)
        .get("/api/mobile/profile")
        .set("Authorization", `Bearer ${doctorToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});

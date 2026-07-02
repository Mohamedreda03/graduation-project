/**
 * Manual Live Database Seeder
 * Wipes the database and populates it with live/ongoing lectures,
 * active student sessions, and 2 weeks of historical records.
 * Run: node src/seeders/seed-live.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const config = require("../config/env");
const {
  ROLES,
  DAYS,
  ATTENDANCE_STATUS,
} = require("../config/constants");

// Models
const {
  User,
  Specialization,
  Hall,
  Course,
  Lecture,
  AttendanceRecord,
  StudentSession,
  ConnectionLog,
  Setting,
  RefreshToken,
} = require("../models");

// ----------------------------------------------------------------------
// FIXED OBJECT IDS FOR POSTMAN INTEGRATION
// ----------------------------------------------------------------------
const SPECIALIZATION_CS_ID = "60d0fe4f5311236168a109c0";
const SPECIALIZATION_IS_ID = "60d0fe4f5311236168a109bf";

const HALL_101_ID = "60d0fe4f5311236168a109d0";
const HALL_102_ID = "60d0fe4f5311236168a109d1";

const DOCTOR_MOHAMED_ID = "60d0fe4f5311236168a109e0";
const DOCTOR_AHMED_ID = "60d0fe4f5311236168a109e1";
const ADMIN_ID = "60d0fe4f5311236168a109e9";

const STUDENT_FULL_ID = "60d0fe4f5311236168a109ca";
const STUDENT_MEDIUM_ID = "60d0fe4f5311236168a109cb";
const STUDENT_EMPTY_ID = "60d0fe4f5311236168a109cc";

const COURSE_CS351_ID = "60d0fe4f5311236168a109c1"; // هندسة البرمجيات
const COURSE_CS361_ID = "60d0fe4f5311236168a109c2"; // الذكاء الاصطناعي
const COURSE_IT321_ID = "60d0fe4f5311236168a109c3"; // شبكات الحاسب

// Helper to calculate times relative to now
const getFormattedTimeOffset = (minutesOffset) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutesOffset);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

const DEFAULT_SETTINGS = [
  {
    key: "MIN_PRESENCE_PERCENTAGE",
    value: 50,
    description: "النسبة المئوية الدنيا للحضور",
  },
  {
    key: "LATE_THRESHOLD_MINUTES",
    value: 15,
    description: "عدد الدقائق المسموح بها للتأخير قبل تسجيل الحالة كمتأخر",
  },
  {
    key: "EARLY_LEAVE_THRESHOLD_MINUTES",
    value: 10,
    description: "Minutes before lecture end to consider as early leave",
  },
  {
    key: "DEVICE_CHANGE_COOLDOWN_DAYS",
    value: 30,
    description: "Minimum days between device change requests",
  },
  {
    key: "MAX_DEVICE_CHANGES_PER_SEMESTER",
    value: 2,
    description: "Maximum number of device changes allowed per semester",
  },
  {
    key: "AUTO_FINALIZE_AFTER_MINUTES",
    value: 30,
    description: "عدد الدقائق لإنهاء المحاضرة تلقائياً",
  },
  {
    key: "SYSTEM_TIMEZONE",
    value: "Africa/Cairo",
    description: "System timezone for date/time calculations",
  },
];

async function seedLive() {
  console.log("🚀 Starting Dynamic Live Database Seeding...");

  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB");

    // 1. Wipe Database
    console.log("🧹 Clearing old data...");
    await User.deleteMany({});
    await Specialization.deleteMany({});
    await Hall.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await StudentSession.deleteMany({});
    await ConnectionLog.deleteMany({});
    await Setting.deleteMany({});
    await RefreshToken.deleteMany({});

    // 2. Create Settings
    console.log("⚙️  Creating settings...");
    await Setting.insertMany(DEFAULT_SETTINGS);

    // 3. Create Specializations
    console.log("🏢 Creating specializations...");
    await Specialization.create([
      {
        _id: SPECIALIZATION_CS_ID,
        name: "علوم الحاسب",
        code: "CS",
        departments: ['عام'], levels: [{ level: 1, name: 'الفرقة الإعدادية', hasDepartments: false }, { level: 2, name: 'الفرقة الأولى', hasDepartments: true }],
        description: "قسم علوم الحاسب",
      },
      {
        _id: SPECIALIZATION_IS_ID,
        name: "نظم المعلومات",
        code: "IS",
        departments: ['عام'], levels: [{ level: 1, name: 'الفرقة الإعدادية', hasDepartments: false }, { level: 2, name: 'الفرقة الأولى', hasDepartments: true }],
        description: "قسم نظم المعلومات",
      },
    ]);

    // 4. Create Halls
    console.log("🏫 Creating halls...");
    await Hall.create([
      {
        _id: HALL_101_ID,
        name: "قاعة 101",
        building: "مبنى أ",
        capacity: 100,
        accessPoint: {
          ssid: "Hall-101-AP",
          ipRange: "192.168.1.0/24",
          apIdentifier: "AP-101-01",
          macAddress: "AA:BB:CC:DD:EE:01",
          isOnline: true,
        },
      },
      {
        _id: HALL_102_ID,
        name: "قاعة 102",
        building: "مبنى أ",
        capacity: 80,
        accessPoint: {
          ssid: "Hall-102-AP",
          ipRange: "192.168.2.0/24",
          apIdentifier: "AP-102-01",
          macAddress: "AA:BB:CC:DD:EE:02",
          isOnline: true,
        },
      },
    ]);

    // 5. Create Admins & Doctors
    console.log("👨‍🏫 Creating admins and doctors...");
    await User.create({
      _id: ADMIN_ID,
      name: { first: "System", last: "Admin" },
      email: "admin@smartattendance.edu",
      password: "admin123456",
      role: ROLES.ADMIN,
      phone: "01000000000",
    });

    await User.create({
      _id: DOCTOR_MOHAMED_ID,
      name: { first: "د. محمد", last: "عبدالله" },
      email: "doctor1@edu.eg",
      password: "doctor123",
      role: ROLES.DOCTOR,
      phone: "01011111111",
    });

    await User.create({
      _id: DOCTOR_AHMED_ID,
      name: { first: "د. أحمد", last: "سالم" },
      email: "drahmed@edu.eg",
      password: "doctor123",
      role: ROLES.DOCTOR,
      phone: "01022222222",
    });

    // 6. Create Students
    console.log("👨‍🎓 Creating students...");
    const studentFull = await User.create({
      _id: STUDENT_FULL_ID,
      name: { first: "كامل", last: "البيانات" },
      email: "student_full@student.edu",
      password: "student123",
      studentId: "20240001",
      role: ROLES.STUDENT,
      academicInfo: {
        specialization: SPECIALIZATION_CS_ID,
        level: 3,
        enrolledCourses: [COURSE_CS351_ID, COURSE_CS361_ID, COURSE_IT321_ID],
      },
      device: {
        macAddress: "AA:BB:CC:DD:EE:FF",
        isVerified: true,
        deviceId: "device-full-id",
        deviceName: "Full Data Phone",
        registeredAt: new Date(),
      },
      isActive: true,
    });

    const studentMedium = await User.create({
      _id: STUDENT_MEDIUM_ID,
      name: { first: "متوسط", last: "البيانات" },
      email: "student_medium@student.edu",
      password: "student123",
      studentId: "20240050",
      role: ROLES.STUDENT,
      academicInfo: {
        specialization: SPECIALIZATION_CS_ID,
        level: 3,
        enrolledCourses: [COURSE_CS351_ID, COURSE_CS361_ID],
      },
      device: {
        macAddress: "11:22:33:44:55:66",
        isVerified: true,
        deviceId: "device-medium-id",
        deviceName: "Medium Data Phone",
        registeredAt: new Date(),
      },
      isActive: true,
    });

    const studentEmpty = await User.create({
      _id: STUDENT_EMPTY_ID,
      name: { first: "فارغ", last: "البيانات" },
      email: "student_empty@student.edu",
      password: "student123",
      studentId: "20240099",
      role: ROLES.STUDENT,
      academicInfo: {
        specialization: SPECIALIZATION_CS_ID,
        level: 3,
        enrolledCourses: [],
      },
      device: {
        macAddress: "FF:EE:DD:CC:BB:AA",
        isVerified: true,
        deviceId: "device-empty-id",
        deviceName: "Empty Data Phone",
        registeredAt: new Date(),
      },
      isActive: true,
    });

    // Seed a few extra students to make attendance look realistic
    const extraStudents = [];
    const names = ["علي حسن", "يوسف إبراهيم", "عمر خالد", "فاطمة أحمد", "مريم علي"];
    for (let i = 0; i < names.length; i++) {
      const [first, last] = names[i].split(" ");
      const extra = await User.create({
        name: { first, last },
        email: `student_extra${i}@student.edu`,
        password: "student123",
        studentId: `2024010${i}`,
        role: ROLES.STUDENT,
        academicInfo: {
          specialization: SPECIALIZATION_CS_ID,
          level: 3,
          enrolledCourses: [COURSE_CS351_ID, COURSE_CS361_ID, COURSE_IT321_ID],
        },
        device: {
          macAddress: `00:11:22:33:44:0${i}`,
          isVerified: true,
          deviceId: `device-extra-${i}`,
          deviceName: "Android Test Phone",
          registeredAt: new Date(),
        },
        isActive: true,
      });
      extraStudents.push(extra._id);
    }

    // 7. Create Courses
    console.log("📚 Creating courses...");
    const allStudentsList = [STUDENT_FULL_ID, STUDENT_MEDIUM_ID, ...extraStudents];
    
    await Course.create([
      {
        _id: COURSE_CS351_ID,
        name: "هندسة البرمجيات",
        code: "CS351",
        specialization: SPECIALIZATION_CS_ID,
        doctor: DOCTOR_MOHAMED_ID,
        level: 3,
        semester: "Spring 2024",
        students: allStudentsList,
      },
      {
        _id: COURSE_CS361_ID,
        name: "الذكاء الاصطناعي",
        code: "CS361",
        specialization: SPECIALIZATION_CS_ID,
        doctor: DOCTOR_MOHAMED_ID,
        level: 3,
        semester: "Spring 2024",
        students: allStudentsList,
      },
      {
        _id: COURSE_IT321_ID,
        name: "شبكات الحاسب",
        code: "IT321",
        specialization: SPECIALIZATION_CS_ID,
        doctor: DOCTOR_AHMED_ID,
        level: 3,
        semester: "Spring 2024",
        students: [STUDENT_FULL_ID, ...extraStudents],
      },
    ]);

    // 8. Create Dynamic relative-time lectures
    console.log("📅 Scheduling live lectures...");
    const todayDay = new Date().getDay(); // 0-6
    const tomorrowDay = (todayDay + 1) % 7;

    const startTimeL1 = getFormattedTimeOffset(-30); // Started 30 mins ago
    const endTimeL1 = getFormattedTimeOffset(90);   // Ends in 90 mins

    const startTimeL2 = getFormattedTimeOffset(120); // Starts in 2 hours
    const endTimeL2 = getFormattedTimeOffset(240);   // Ends in 4 hours

    // Lecture 1: Live Now (Software Engineering CS351)
    const lecture1 = await Lecture.create({
      course: COURSE_CS351_ID,
      hall: HALL_101_ID,
      doctor: DOCTOR_MOHAMED_ID,
      dayOfWeek: todayDay,
      startTime: startTimeL1,
      endTime: endTimeL1,
      type: "lecture",
      lectureType: "lecture",
      status: "scheduled",
      isActive: true,
      level: 3,
    });

    // Lecture 2: Upcoming Today - Countdown (AI CS361)
    const lecture2 = await Lecture.create({
      course: COURSE_CS361_ID,
      hall: HALL_102_ID,
      doctor: DOCTOR_MOHAMED_ID,
      dayOfWeek: todayDay,
      startTime: startTimeL2,
      endTime: endTimeL2,
      type: "lecture",
      lectureType: "lecture",
      status: "scheduled",
      isActive: true,
      level: 3,
    });

    // Lecture 3: Tomorrow (Networks IT321)
    const lecture3 = await Lecture.create({
      course: COURSE_IT321_ID,
      hall: HALL_101_ID,
      doctor: DOCTOR_AHMED_ID,
      dayOfWeek: tomorrowDay,
      startTime: "10:00",
      endTime: "12:00",
      type: "lecture",
      lectureType: "lecture",
      status: "scheduled",
      isActive: true,
      level: 3,
    });

    // Add other weekday lectures to populate the weekly calendar naturally
    const weekdayOffsets = [2, 3, 4];
    for (const offset of weekdayOffsets) {
      const targetDay = (todayDay + offset) % 7;
      if (targetDay === 5) continue; // Skip Friday
      await Lecture.create({
        course: COURSE_CS351_ID,
        hall: HALL_101_ID,
        doctor: DOCTOR_MOHAMED_ID,
        dayOfWeek: targetDay,
        startTime: "09:00",
        endTime: "11:00",
        type: "lecture",
        lectureType: "lecture",
        status: "scheduled",
        isActive: true,
        level: 3,
      });
    }

    // 9. Create Active Session & In-Progress Attendance for Ongoing Lecture
    console.log("⚡ Creating active sessions for student_full and student_medium...");
    const now = new Date();

    // Student Full Session
    const recordFull = await AttendanceRecord.create({
      student: STUDENT_FULL_ID,
      course: COURSE_CS351_ID,
      lecture: lecture1._id,
      hall: HALL_101_ID,
      date: now,
      status: "in-progress",
      presencePercentage: 0,
      totalPresenceTime: 0,
      isFinalized: false,
      sessions: [],
    });

    await StudentSession.create({
      student: STUDENT_FULL_ID,
      macAddress: "AA:BB:CC:DD:EE:FF",
      deviceId: "device-full-id",
      currentHall: HALL_101_ID,
      currentLecture: lecture1._id,
      attendanceRecord: recordFull._id,
      connectedAt: now,
      isActive: true,
      networkVerified: true,
    });

    // Student Medium Session
    const recordMedium = await AttendanceRecord.create({
      student: STUDENT_MEDIUM_ID,
      course: COURSE_CS351_ID,
      lecture: lecture1._id,
      hall: HALL_101_ID,
      date: now,
      status: "in-progress",
      presencePercentage: 0,
      totalPresenceTime: 0,
      isFinalized: false,
      sessions: [],
    });

    await StudentSession.create({
      student: STUDENT_MEDIUM_ID,
      macAddress: "11:22:33:44:55:66",
      deviceId: "device-medium-id",
      currentHall: HALL_101_ID,
      currentLecture: lecture1._id,
      attendanceRecord: recordMedium._id,
      connectedAt: now,
      isActive: true,
      networkVerified: true,
    });

    // 10. Generate 2 Weeks of Completed Attendance History
    console.log("📊 Generating 2 weeks of completed attendance records...");
    const startDate = new Date();
    startDate.setDate(now.getDate() - 14);

    // Let's create static lectures specifically to serve as historical templates
    const historicalLectures = [
      { course: COURSE_CS351_ID, hall: HALL_101_ID, dayOfWeek: 0, time: 9 }, // Sun
      { course: COURSE_CS361_ID, hall: HALL_102_ID, dayOfWeek: 1, time: 12 }, // Mon
      { course: COURSE_IT321_ID, hall: HALL_101_ID, dayOfWeek: 2, time: 10 }, // Tue
    ];

    const allHistoricalLectures = [];
    for (const hLec of historicalLectures) {
      const createdH = await Lecture.create({
        course: hLec.course,
        hall: hLec.hall,
        doctor: hLec.course === COURSE_IT321_ID ? DOCTOR_AHMED_ID : DOCTOR_MOHAMED_ID,
        dayOfWeek: hLec.dayOfWeek,
        startTime: `${String(hLec.time).padStart(2, "0")}:00`,
        endTime: `${String(hLec.time + 2).padStart(2, "0")}:00`,
        type: "lecture",
        lectureType: "lecture",
        status: "scheduled",
        isActive: true,
        level: 3,
      });
      allHistoricalLectures.push(createdH);
    }

    const pastAttendanceRecords = [];
    
    // Loop through past 14 days
    for (let d = new Date(startDate); d < now; d.setDate(d.getDate() + 1)) {
      const dayVal = d.getDay();
      
      // Find historical lecture templates for this day of the week
      const dayLectures = allHistoricalLectures.filter(l => l.dayOfWeek === dayVal);
      
      for (const lec of dayLectures) {
        const recordDate = new Date(d);
        const [startH] = lec.startTime.split(":").map(Number);
        recordDate.setHours(startH, 0, 0, 0);

        // Generate records for student_full and student_medium
        const targetStudents = [
          { id: STUDENT_FULL_ID, enrolled: [COURSE_CS351_ID, COURSE_CS361_ID, COURSE_IT321_ID] },
          { id: STUDENT_MEDIUM_ID, enrolled: [COURSE_CS351_ID, COURSE_CS361_ID] }
        ];

        for (const target of targetStudents) {
          // Check if student enrolled in this lecture's course
          if (!target.enrolled.includes(String(lec.course))) continue;

          // 80% Present, 10% Late, 10% Absent
          const rand = Math.random();
          let status = "present";
          let presencePercentage = 100;
          let totalPresenceTime = 120; // 2 hours in minutes

          if (rand > 0.9) {
            status = "absent";
            presencePercentage = 0;
            totalPresenceTime = 0;
          } else if (rand > 0.8) {
            status = "present";
            presencePercentage = 80;
            totalPresenceTime = 96;
          }

          pastAttendanceRecords.push({
            student: target.id,
            course: lec.course,
            lecture: lec._id,
            hall: lec.hall,
            date: recordDate,
            status,
            presencePercentage,
            totalPresenceTime,
            isFinalized: true,
            checkInTime: status !== "absent" ? new Date(new Date(recordDate).setMinutes(10)) : null,
            sessions: status !== "absent" ? [{
              checkIn: recordDate,
              checkOut: new Date(new Date(recordDate).setHours(recordDate.getHours() + 2)),
            }] : [],
          });
        }
      }
    }

    if (pastAttendanceRecords.length > 0) {
      await AttendanceRecord.insertMany(pastAttendanceRecords);
      console.log(`✅ Seeded ${pastAttendanceRecords.length} historical attendance records.`);
    }

    console.log("\n🎉 Live Database Seeding Completed Successfully!");
    console.log("-----------------------------------------");
    console.log("👤 Admin:    admin@smartattendance.edu / admin123456");
    console.log("👨‍🏫 Doctor:   doctor1@edu.eg / doctor123");
    console.log("👨‍🎓 Student (Full):   student_full@student.edu / student123");
    console.log("👨‍🎓 Student (Medium): student_medium@student.edu / student123");
    console.log("👨‍🎓 Student (Empty):  student_empty@student.edu / student123");
    console.log("-----------------------------------------");
    console.log("🚀 You can now run the dev server and test using your local postman collection!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Live seeding failed:", error);
    process.exit(1);
  }
}

seedLive();

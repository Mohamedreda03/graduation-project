/**
 * Large Database Seeder
 * Creates comprehensive test data for admin and doctor dashboards
 * Run: node src/seeders/seed-large.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/env");
const {
  ROLES,
  ADMIN_ROLES,
  ATTENDANCE_STATUS,
  WORKING_DAYS,
  CONNECTION_EVENTS,
} = require("../config/constants");

// Models
const User = require("../models/User");
const Specialization = require("../models/Specialization");
const Hall = require("../models/Hall");
const Course = require("../models/Course");
const Lecture = require("../models/Lecture");
const AttendanceRecord = require("../models/AttendanceRecord");
const Setting = require("../models/Setting");
const ConnectionLog = require("../models/ConnectionLog");
const StudentSession = require("../models/StudentSession");

// ========== SEED DATA ==========

// Default Settings
const defaultSettings = [
  {
    key: "MIN_PRESENCE_PERCENTAGE",
    value: 50,
    description:
      "Minimum presence percentage required for attendance to be marked as present",
  },
  {
    key: "LATE_THRESHOLD_MINUTES",
    value: 15,
    description: "Minutes after lecture start to mark attendance as late",
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
    description:
      "Minutes after lecture end to auto-finalize attendance records",
  },
  {
    key: "SYSTEM_TIMEZONE",
    value: "Africa/Cairo",
    description: "System timezone for date/time calculations",
  },
];

// Specializations
const specializations = [
  {
    name: "علوم الحاسب",
    code: "CS",
    faculty: "كلية الحاسبات والمعلومات",
    description: "قسم علوم الحاسب",
  },
  {
    name: "نظم المعلومات",
    code: "IS",
    faculty: "كلية الحاسبات والمعلومات",
    description: "قسم نظم المعلومات",
  },
  {
    name: "تكنولوجيا المعلومات",
    code: "IT",
    faculty: "كلية الحاسبات والمعلومات",
    description: "قسم تكنولوجيا المعلومات",
  },
  {
    name: "الذكاء الاصطناعي",
    code: "AI",
    faculty: "كلية الحاسبات والمعلومات",
    description: "قسم الذكاء الاصطناعي",
  },
];

// Halls
const halls = [
  {
    name: "قاعة 101",
    building: "المبنى الرئيسي",
    capacity: 100,
    accessPoint: {
      ssid: "Hall101_AP",
      ipRange: "192.168.1",
      apIdentifier: "AP_101",
      isOnline: true,
    },
  },
  {
    name: "قاعة 102",
    building: "المبنى الرئيسي",
    capacity: 80,
    accessPoint: {
      ssid: "Hall102_AP",
      ipRange: "192.168.2",
      apIdentifier: "AP_102",
      isOnline: true,
    },
  },
  {
    name: "قاعة 103",
    building: "المبنى الرئيسي",
    capacity: 60,
    accessPoint: {
      ssid: "Hall103_AP",
      ipRange: "192.168.3",
      apIdentifier: "AP_103",
      isOnline: true,
    },
  },
  {
    name: "قاعة 201",
    building: "المبنى الفرعي",
    capacity: 120,
    accessPoint: {
      ssid: "Hall201_AP",
      ipRange: "192.168.4",
      apIdentifier: "AP_201",
      isOnline: true,
    },
  },
  {
    name: "قاعة 202",
    building: "المبنى الفرعي",
    capacity: 90,
    accessPoint: {
      ssid: "Hall202_AP",
      ipRange: "192.168.5",
      apIdentifier: "AP_202",
      isOnline: false,
    },
  },
  {
    name: "معمل 1",
    building: "مبنى المعامل",
    capacity: 40,
    accessPoint: {
      ssid: "Lab1_AP",
      ipRange: "192.168.6",
      apIdentifier: "AP_LAB1",
      isOnline: true,
    },
  },
  {
    name: "معمل 2",
    building: "مبنى المعامل",
    capacity: 40,
    accessPoint: {
      ssid: "Lab2_AP",
      ipRange: "192.168.7",
      apIdentifier: "AP_LAB2",
      isOnline: true,
    },
  },
  {
    name: "معمل 3",
    building: "مبنى المعامل",
    capacity: 35,
    accessPoint: {
      ssid: "Lab3_AP",
      ipRange: "192.168.8",
      apIdentifier: "AP_LAB3",
      isOnline: true,
    },
  },
];

// Admins
const admins = [
  {
    name: { first: "أحمد", last: "المدير (مدير النظام)" },
    email: "admin@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    adminRole: ADMIN_ROLES.SUPER_ADMIN,
    isActive: true,
  },
  {
    name: { first: "أ.د. سليمان", last: "العميد" },
    email: "dean@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    adminRole: ADMIN_ROLES.DEAN,
    isActive: true,
  },
  {
    name: { first: "أمل", last: "شؤون الطلاب" },
    email: "student.affairs@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    adminRole: ADMIN_ROLES.STUDENT_AFFAIRS,
    isActive: true,
  },
];

// Doctors (10 doctors)
const doctorNames = [
  { first: "محمد", last: "عبدالله" },
  { first: "أحمد", last: "سعيد" },
  { first: "خالد", last: "إبراهيم" },
  { first: "عمر", last: "حسن" },
  { first: "يوسف", last: "محمود" },
  { first: "علي", last: "فاروق" },
  { first: "سامي", last: "عبدالرحمن" },
  { first: "طارق", last: "السيد" },
  { first: "حسام", last: "الدين" },
  { first: "مصطفى", last: "كمال" },
];

// Course names per specialization
const coursesBySpecialization = {
  CS: [
    { name: "مقدمة في البرمجة", code: "CS101", level: 1 },
    { name: "هياكل البيانات", code: "CS201", level: 2 },
    { name: "الخوارزميات", code: "CS202", level: 2 },
    { name: "قواعد البيانات", code: "CS301", level: 3 },
    { name: "نظم التشغيل", code: "CS302", level: 3 },
    { name: "شبكات الحاسب", code: "CS303", level: 3 },
    { name: "هندسة البرمجيات", code: "CS401", level: 4 },
    { name: "الذكاء الاصطناعي", code: "CS402", level: 4 },
  ],
  IS: [
    { name: "مقدمة في نظم المعلومات", code: "IS101", level: 1 },
    { name: "تحليل النظم", code: "IS201", level: 2 },
    { name: "تصميم النظم", code: "IS202", level: 2 },
    { name: "إدارة قواعد البيانات", code: "IS301", level: 3 },
    { name: "نظم دعم القرار", code: "IS302", level: 3 },
    { name: "أمن المعلومات", code: "IS401", level: 4 },
  ],
  IT: [
    { name: "أساسيات تكنولوجيا المعلومات", code: "IT101", level: 1 },
    { name: "إدارة الشبكات", code: "IT201", level: 2 },
    { name: "أمن الشبكات", code: "IT301", level: 3 },
    { name: "الحوسبة السحابية", code: "IT302", level: 3 },
    { name: "إنترنت الأشياء", code: "IT401", level: 4 },
  ],
  AI: [
    { name: "مقدمة في الذكاء الاصطناعي", code: "AI101", level: 1 },
    { name: "تعلم الآلة", code: "AI201", level: 2 },
    { name: "التعلم العميق", code: "AI301", level: 3 },
    { name: "معالجة اللغات الطبيعية", code: "AI302", level: 3 },
    { name: "رؤية الحاسب", code: "AI401", level: 4 },
  ],
};

// Arabic first names for students
const arabicFirstNames = [
  "أحمد",
  "محمد",
  "علي",
  "عمر",
  "يوسف",
  "خالد",
  "طارق",
  "سامي",
  "حسن",
  "إبراهيم",
  "عبدالله",
  "مصطفى",
  "حسام",
  "كريم",
  "ياسر",
  "مروان",
  "بلال",
  "زياد",
  "آدم",
  "نور",
  "فاطمة",
  "سارة",
  "مريم",
  "نورهان",
  "رانيا",
  "داليا",
  "هاجر",
  "آية",
  "سلمى",
  "جنى",
  "ملك",
  "روان",
  "دينا",
  "ياسمين",
  "منى",
  "هبة",
  "إسراء",
  "شيماء",
  "نسمة",
  "لمياء",
];

// Arabic last names for students
const arabicLastNames = [
  "محمد",
  "أحمد",
  "علي",
  "حسن",
  "إبراهيم",
  "عبدالله",
  "السيد",
  "محمود",
  "عبدالرحمن",
  "سعيد",
  "فاروق",
  "خليل",
  "عثمان",
  "يوسف",
  "طه",
  "مصطفى",
  "جمال",
  "كمال",
  "فهمي",
  "رشدي",
  "الشافعي",
  "البدوي",
  "الجندي",
  "الشريف",
  "القاضي",
  "الحكيم",
  "النجار",
  "الصياد",
  "العطار",
  "الحداد",
];

// Lecture times
const lectureTimes = [
  { start: "08:00", end: "09:30" },
  { start: "09:45", end: "11:15" },
  { start: "11:30", end: "13:00" },
  { start: "13:30", end: "15:00" },
  { start: "15:15", end: "16:45" },
];

// Helper functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomHex() {
  const chars = "0123456789ABCDEF";
  return chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)];
}

function generateStudentId(index) {
  const year = randomInt(2020, 2024);
  const num = String(index).padStart(4, "0");
  return `${year}${num}`;
}

// ========== SEEDER FUNCTIONS ==========

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");
  await Promise.all([
    AttendanceRecord.deleteMany({}),
    Lecture.deleteMany({}),
    Course.deleteMany({}),
    Hall.deleteMany({}),
    User.deleteMany({}),
    Specialization.deleteMany({}),
    Setting.deleteMany({}),
    ConnectionLog.deleteMany({}),
    StudentSession.deleteMany({}),
  ]);
  console.log("✅ Database cleared");
}

async function seedSettings() {
  console.log("⚙️  Seeding settings...");
  await Setting.insertMany(defaultSettings);
  console.log(`✅ Created ${defaultSettings.length} settings`);
}

async function seedSpecializations() {
  console.log("🏛️  Seeding specializations...");
  const created = await Specialization.insertMany(specializations);
  console.log(`✅ Created ${created.length} specializations`);
  return created;
}

async function seedHalls() {
  console.log("🚪 Seeding halls...");
  const created = await Hall.insertMany(halls);
  console.log(`✅ Created ${created.length} halls`);
  return created;
}

async function seedAdmins(deptList) {
  console.log("👨‍💼 Seeding admins...");
  const createdAdmins = [];
  
  for (const adminData of admins) {
    const adminUser = await User.create(adminData);
    createdAdmins.push(adminUser);
  }

  for (const dept of deptList) {
    const hod = await User.create({
      name: { first: `رئيس قسم`, last: dept.name },
      email: `hod.${dept.code.toLowerCase()}@smartattendance.edu`,
      password: "admin123456",
      role: ROLES.ADMIN,
      adminRole: ADMIN_ROLES.HEAD_OF_DEPT,
      department: dept._id,
      isActive: true,
    });
    createdAdmins.push(hod);
  }

  console.log(`✅ Created ${createdAdmins.length} admins (Super Admin, Dean, Student Affairs, and HODs)`);
  return createdAdmins;
}

async function seedDoctors(deptList) {
  console.log("👨‍🏫 Seeding doctors...");
  const doctors = [];

  for (let i = 0; i < doctorNames.length; i++) {
    const dept = deptList[i % deptList.length];
    const doctor = await User.create({
      name: { first: `د. ${doctorNames[i].first}`, last: doctorNames[i].last },
      email: `doctor${i + 1}@edu.eg`,
      password: "doctor123",
      role: ROLES.DOCTOR,
      phone: `0101234567${i}`,
      isActive: true,
    });
    doctors.push(doctor);
  }

  console.log(`✅ Created ${doctors.length} doctors`);
  console.log(
    "   Login credentials: doctor1@edu.eg - doctor10@edu.eg / doctor123",
  );
  return doctors;
}

async function seedStudents(deptList) {
  console.log("👨‍🎓 Seeding students (this may take a moment)...");
  const students = [];
  const csDept = deptList[0]; // CS is the first specialization

  // 1. Full Data Student
  students.push({
    name: { first: "كامل", last: "البيانات" },
    email: "student_full@student.edu",
    password: "student123",
    studentId: "20240001",
    role: ROLES.STUDENT,
    academicInfo: {
      specialization: csDept._id,
      level: 3,
    },
    device: {
      macAddress: "AA:BB:CC:DD:EE:FF",
      isVerified: true,
      deviceId: "device-full-id",
      deviceName: "Full Data Phone",
    },
    isActive: true,
  });

  // 2. Medium Data Student
  students.push({
    name: { first: "متوسط", last: "البيانات" },
    email: "student_medium@student.edu",
    password: "student123",
    studentId: "20240050",
    role: ROLES.STUDENT,
    academicInfo: {
      specialization: csDept._id,
      level: 3,
    },
    device: {
      macAddress: "11:22:33:44:55:66",
      isVerified: true,
      deviceId: "device-medium-id",
      deviceName: "Medium Data Phone",
    },
    isActive: true,
  });

  // 3. Empty Data Student
  students.push({
    name: { first: "فارغ", last: "البيانات" },
    email: "student_empty@student.edu",
    password: "student123",
    studentId: "20240099",
    role: ROLES.STUDENT,
    academicInfo: {
      specialization: csDept._id,
      level: 3,
    },
    device: {
      macAddress: "FF:EE:DD:CC:BB:AA",
      isVerified: true,
      deviceId: "device-empty-id",
      deviceName: "Empty Data Phone",
    },
    isActive: true,
  });

  let studentIndex = 1000;
  for (const dept of deptList) {
    // 125 students per specialization, total 500. Since we manually inserted 3, let's distribute the remaining 497
    const deptStudentsCount = dept.code === "CS" ? 122 : 125;
    for (let i = 0; i < deptStudentsCount; i++) {
      const firstName = randomElement(arabicFirstNames);
      const lastName = randomElement(arabicLastNames);
      const level = randomInt(1, 4);
      const studentId = generateStudentId(studentIndex);

      const student = {
        name: { first: firstName, last: lastName },
        email: `student${studentIndex}@student.edu`,
        password: "student123",
        studentId: studentId,
        role: ROLES.STUDENT,
        academicInfo: {
          specialization: dept._id,
          level: level,
        },
        device: {
          macAddress: `00:1A:2B:3C:${randomHex()}:${randomHex()}`,
          isVerified: true,
          deviceId: `device-${studentIndex}-id`,
          deviceName: `${firstName}'s Phone`,
        },
        isActive: true,
      };

      students.push(student);
      studentIndex++;
    }
  }

  // Batch insert for better performance
  await User.insertMany(students);
  console.log(`✅ Created ${students.length} students`);
  console.log(
    "   Login credentials: student_full@student.edu, student_medium@student.edu, student_empty@student.edu / student123",
  );

  // Return student documents with _id
  return await User.find({ role: ROLES.STUDENT });
}

async function seedCourses(deptList, doctors) {
  console.log("📚 Seeding courses...");
  const courses = [];
  const semester = "خريف 2025";

  let doctorIndex = 0;
  for (const dept of deptList) {
    const deptCourses = coursesBySpecialization[dept.code] || [];

    for (const courseData of deptCourses) {
      const doctor = doctors[doctorIndex % doctors.length];

      const course = await Course.create({
        name: courseData.name,
        code: courseData.code,
        specialization: dept._id,
        doctor: doctor._id,
        level: courseData.level,
        semester: semester,
        students: [], // Will be filled later
        isActive: true,
      });

      courses.push(course);
      doctorIndex++;
    }
  }

  console.log(`✅ Created ${courses.length} courses`);
  return courses;
}

async function enrollStudentsInCourses(courses, students) {
  console.log("📝 Enrolling students in courses...");

  for (const course of courses) {
    // Find students in the same specialization and level
    const eligibleStudents = students.filter(
      (s) => {
        // Skip empty student entirely (0 courses)
        if (s.email === "student_empty@student.edu") {
          return false;
        }

        // Limit medium student to 2 courses maximum
        if (s.email === "student_medium@student.edu") {
          if (!s.academicInfo.enrolledCourses) {
            s.academicInfo.enrolledCourses = [];
          }
          const currentCount = s.academicInfo.enrolledCourses.length;
          if (currentCount >= 2) {
            return false;
          }
        }

        return (
          s.academicInfo.specialization.toString() === course.specialization.toString() &&
          s.academicInfo.level === course.level
        );
      }
    );

    // Enroll all eligible students
    if (eligibleStudents.length > 0) {
      course.students = eligibleStudents.map((s) => s._id);
      await course.save();

      // Update student's enrolled courses
      for (const student of eligibleStudents) {
        if (!student.academicInfo.enrolledCourses) {
          student.academicInfo.enrolledCourses = [];
        }
        student.academicInfo.enrolledCourses.push(course._id);
        await student.save();
      }
    }
  }

  console.log("✅ Students enrolled in courses");
}

async function seedLectures(courses, hallList) {
  console.log("📅 Seeding lectures...");
  const lectures = [];

  // Create schedule - each course gets 2 lectures per week
  for (const course of courses) {
    if (course.code === "CS301") {
      // Custom schedule for full/medium test students (Every day coverage)
      for (const d of [6, 0, 1, 2]) {
        lectures.push({
          course: course._id,
          hall: hallList[0]._id,
          doctor: course.doctor,
          dayOfWeek: d,
          startTime: "09:00",
          endTime: "11:00",
          level: course.level,
          specialization: course.specialization,
          isActive: true,
        });
      }
    } else if (course.code === "CS302") {
      // Custom schedule for full/medium test students (Every day coverage)
      for (const d of [3, 4, 5]) {
        lectures.push({
          course: course._id,
          hall: hallList[0]._id,
          doctor: course.doctor,
          dayOfWeek: d,
          startTime: "12:00",
          endTime: "14:00",
          level: course.level,
          specialization: course.specialization,
          isActive: true,
        });
      }
    } else {
      const day1 = WORKING_DAYS[randomInt(0, 2)]; // السبت - الاثنين
      const day2 = WORKING_DAYS[randomInt(3, 5)]; // الثلاثاء - الخميس
      const timeSlot1 = randomElement(lectureTimes);
      const timeSlot2 = randomElement(lectureTimes);
      const hall = hallList[randomInt(0, hallList.length - 1)];

      // First lecture
      lectures.push({
        course: course._id,
        hall: hall._id,
        doctor: course.doctor,
        dayOfWeek: day1,
        startTime: timeSlot1.start,
        endTime: timeSlot1.end,
        level: course.level,
        specialization: course.specialization,
        isActive: true,
      });

      // Second lecture
      lectures.push({
        course: course._id,
        hall: hall._id,
        doctor: course.doctor,
        dayOfWeek: day2,
        startTime: timeSlot2.start,
        endTime: timeSlot2.end,
        level: course.level,
        specialization: course.specialization,
        isActive: true,
      });
    }
  }

  await Lecture.insertMany(lectures);
  console.log(`✅ Created ${lectures.length} lectures`);

  return await Lecture.find({}).populate("hall");
}

async function seedAttendanceRecords(lectures, students) {
  console.log("📊 Seeding attendance records and connection logs (this may take a while)...");
  const records = [];
  const connectionLogs = [];
  const studentSessions = [];

  const studentFull = students.find(s => s.email === "student_full@student.edu");
  const studentMedium = students.find(s => s.email === "student_medium@student.edu");
  const studentEmpty = students.find(s => s.email === "student_empty@student.edu");

  // Map students by ID for fast lookup
  const studentMap = new Map();
  for (const s of students) {
    studentMap.set(s._id.toString(), s);
  }

  // Generate attendance for 2 weeks in past and 2 weeks in future
  const today = new Date();
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0); // Normalize to midnight
  const todayDay = todayNormalized.getDay();

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);

  // Find lectures that occur on today's day of week
  const todayLectures = lectures.filter(l => l.dayOfWeek === todayDay);
  console.log(`Found ${todayLectures.length} lectures scheduled for today.`);

  // Let's mark the first 2 lectures of today as "in-progress" (live)
  const liveLectures = todayLectures.slice(0, 2);
  const liveLectureIds = new Set(liveLectures.map(l => l._id.toString()));

  // For the live lectures, we need to update their status in the DB
  for (const lecture of liveLectures) {
    const [startHour, startMin] = lecture.startTime.split(":").map(Number);
    const startOffset = randomInt(-3, 5);
    const doctorStartTime = new Date(todayNormalized);
    doctorStartTime.setHours(startHour, startMin + startOffset, 0, 0);

    await Lecture.findByIdAndUpdate(lecture._id, {
      status: "in-progress",
      actualStartTime: doctorStartTime,
    });
    // Update the local object as well
    lecture.status = "in-progress";
    lecture.actualStartTime = doctorStartTime;
  }

  for (const lecture of lectures) {
    // Get course to find enrolled students
    const course = await Course.findById(lecture.course);
    if (!course || !course.students || course.students.length === 0) continue;

    // Loop through each day in the 4-week range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== lecture.dayOfWeek) continue;

      const lectureDate = new Date(d);
      lectureDate.setHours(0, 0, 0, 0); // Normalize to midnight for accurate day filtering

      const isToday = lectureDate.getTime() === todayNormalized.getTime();
      const isLive = isToday && liveLectureIds.has(lecture._id.toString());

      // Calculate Doctor's actual start and end times for this specific day's lecture
      const [startHour, startMin] = lecture.startTime.split(":").map(Number);
      const [endHour, endMin] = lecture.endTime.split(":").map(Number);

      // Doctor starts lecture between -3 and +5 minutes from scheduled start
      const startOffset = randomInt(-3, 5);
      const doctorStartTime = isLive && lecture.actualStartTime ? lecture.actualStartTime : new Date(lectureDate);
      if (!isLive || !lecture.actualStartTime) {
        doctorStartTime.setHours(startHour, startMin + startOffset, 0, 0);
      }

      // Doctor ends lecture between -5 and +2 minutes from scheduled end
      const endOffset = randomInt(-5, 2);
      const doctorEndTime = new Date(lectureDate);
      doctorEndTime.setHours(endHour, endMin + endOffset, 0, 0);

      // Calculate actual lecture duration in minutes
      const actualLectureDuration = Math.round((doctorEndTime - doctorStartTime) / 60000);

      // Generate attendance for each enrolled student
      for (const studentId of course.students) {
        // Skip empty student entirely
        if (studentEmpty && studentId.toString() === studentEmpty._id.toString()) {
          continue;
        }

        const student = studentMap.get(studentId.toString());
        if (!student) continue;

        if (isLive) {
          // If this is a live lecture, seed in-progress records for present students
          // 85% present rate, 15% absent
          if (Math.random() < 0.15) {
            continue; // Absent: no record for now
          }

          // Student checks in between -5 and 10 minutes from doctor start time
          const checkInOffset = randomInt(-5, 10);
          const checkIn = new Date(doctorStartTime.getTime() + checkInOffset * 60000);

          const totalPresenceTime = randomInt(15, 35); // present for 15-35 minutes so far
          const presencePercentage = Math.round((totalPresenceTime / 90) * 100);

          const recordId = new mongoose.Types.ObjectId();
          records.push({
            _id: recordId,
            student: studentId,
            lecture: lecture._id,
            course: course._id,
            hall: lecture.hall._id || lecture.hall,
            date: lectureDate,
            sessions: [{ checkIn }],
            totalPresenceTime,
            lectureTime: 90,
            presencePercentage,
            status: ATTENDANCE_STATUS.IN_PROGRESS,
            isFinalized: false,
            lectureStartTime: doctorStartTime,
          });

          // Create active StudentSession
          studentSessions.push({
            student: studentId,
            macAddress: student.device?.macAddress || "00:00:00:00:00:00",
            currentHall: lecture.hall._id || lecture.hall,
            currentLecture: lecture._id,
            attendanceRecord: recordId,
            connectedAt: checkIn,
            isActive: true,
          });

          // Create a CONNECTED connection log
          const ipPrefix = lecture.hall?.accessPoint?.ipRange || "192.168.1";
          connectionLogs.push({
            macAddress: student.device?.macAddress || "00:00:00:00:00:00",
            ipAddress: `${ipPrefix}.${randomInt(2, 254)}`,
            hall: lecture.hall._id || lecture.hall,
            eventType: CONNECTION_EVENTS.CONNECTED,
            timestamp: checkIn,
            processed: true,
            processingResult: "Check-in recorded for live lecture",
            student: student._id,
            attendanceRecord: recordId,
          });

        } else {
          // Normal historical completed lectures logic
          const rand = Math.random();
          let status, presencePercentage, totalPresenceTime;
          let sessions = [];

          if (rand < 0.1) {
            // Absent
            status = ATTENDANCE_STATUS.ABSENT;
            presencePercentage = 0;
            totalPresenceTime = 0;
          } else {
            // Student is present
            if (rand < 0.2) {
              // Low attendance (e.g. 20% to 49%)
              presencePercentage = randomInt(20, 49);
            } else {
              // Good attendance (e.g. 50% to 100%)
              presencePercentage = randomInt(50, 100);
            }

            totalPresenceTime = Math.floor((actualLectureDuration * presencePercentage) / 100);
            status = ATTENDANCE_STATUS.PRESENT;

            // Generate student check-in/out times matching totalPresenceTime
            let checkIn, checkOut;
            if (presencePercentage >= 50) {
              const checkInOffset = randomInt(-5, 5);
              checkIn = new Date(doctorStartTime.getTime() + checkInOffset * 60000);
              checkOut = new Date(checkIn.getTime() + totalPresenceTime * 60000);
              
              if (checkOut > new Date(doctorEndTime.getTime() + 5 * 60000)) {
                checkOut = new Date(doctorEndTime.getTime() + randomInt(0, 5) * 60000);
                totalPresenceTime = Math.round((checkOut - checkIn) / 60000);
                presencePercentage = Math.min(100, Math.round((totalPresenceTime / actualLectureDuration) * 100));
              }
            } else {
              const isLate = Math.random() < 0.5;
              if (isLate) {
                const lateMins = actualLectureDuration - totalPresenceTime;
                checkIn = new Date(doctorStartTime.getTime() + lateMins * 60000);
                checkOut = new Date(doctorEndTime.getTime() + randomInt(0, 3) * 60000);
                totalPresenceTime = Math.round((checkOut - checkIn) / 60000);
                presencePercentage = Math.min(100, Math.round((totalPresenceTime / actualLectureDuration) * 100));
              } else {
                checkIn = new Date(doctorStartTime.getTime() + randomInt(-2, 2) * 60000);
                checkOut = new Date(checkIn.getTime() + totalPresenceTime * 60000);
                totalPresenceTime = Math.round((checkOut - checkIn) / 60000);
                presencePercentage = Math.min(100, Math.round((totalPresenceTime / actualLectureDuration) * 100));
              }
            }

            sessions.push({ checkIn, checkOut });
          }

          const recordId = new mongoose.Types.ObjectId();

          records.push({
            _id: recordId,
            student: studentId,
            lecture: lecture._id,
            course: course._id,
            hall: lecture.hall._id || lecture.hall,
            date: lectureDate,
            sessions,
            totalPresenceTime,
            lectureTime: actualLectureDuration,
            presencePercentage,
            status,
            isFinalized: true,
            finalizedAt: lectureDate,
            lectureStartTime: doctorStartTime,
            lectureEndTime: doctorEndTime,
          });

          // Generate Connection Logs for the student connect/disconnect events
          if (sessions.length > 0) {
            const ipPrefix = lecture.hall?.accessPoint?.ipRange || "192.168.1";
            for (const session of sessions) {
              if (session.checkIn) {
                connectionLogs.push({
                  macAddress: student.device?.macAddress || "00:00:00:00:00:00",
                  ipAddress: `${ipPrefix}.${randomInt(2, 254)}`,
                  hall: lecture.hall._id || lecture.hall,
                  eventType: CONNECTION_EVENTS.CONNECTED,
                  timestamp: session.checkIn,
                  processed: true,
                  processingResult: "Check-in recorded for lecture",
                  student: student._id,
                  attendanceRecord: recordId,
                });
              }
              if (session.checkOut) {
                connectionLogs.push({
                  macAddress: student.device?.macAddress || "00:00:00:00:00:00",
                  ipAddress: `${ipPrefix}.${randomInt(2, 254)}`,
                  hall: lecture.hall._id || lecture.hall,
                  eventType: CONNECTION_EVENTS.DISCONNECTED,
                  timestamp: session.checkOut,
                  processed: true,
                  processingResult: "Check-out recorded, marked as present",
                  student: student._id,
                  attendanceRecord: recordId,
                });
              }
            }
          }
        }
      }
    }
  }

  // Batch insert in chunks for better performance
  const chunkSize = 1000;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    await AttendanceRecord.insertMany(chunk);
    console.log(
      `   Inserted ${Math.min(i + chunkSize, records.length)}/${records.length} attendance records`
    );
  }

  // Batch insert connection logs in chunks
  for (let i = 0; i < connectionLogs.length; i += chunkSize) {
    const chunk = connectionLogs.slice(i, i + chunkSize);
    await ConnectionLog.insertMany(chunk);
    console.log(
      `   Inserted ${Math.min(i + chunkSize, connectionLogs.length)}/${connectionLogs.length} connection logs`
    );
  }

  // Batch insert student sessions
  if (studentSessions.length > 0) {
    for (let i = 0; i < studentSessions.length; i += chunkSize) {
      const chunk = studentSessions.slice(i, i + chunkSize);
      await StudentSession.insertMany(chunk);
    }
    console.log(`✅ Created ${studentSessions.length} active student sessions`);
  }

  console.log(`✅ Created ${records.length} attendance records`);
  console.log(`✅ Created ${connectionLogs.length} connection logs`);
}

// ========== MAIN SEEDER ==========

async function seed() {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB\n");

    // Clear existing data
    await clearDatabase();
    console.log("");

    // Seed data
    await seedSettings();
    const deptList = await seedSpecializations();
    const hallList = await seedHalls();
    await seedAdmins(deptList);
    const doctors = await seedDoctors(deptList);
    const students = await seedStudents(deptList);
    const courses = await seedCourses(deptList, doctors);
    await enrollStudentsInCourses(courses, students);
    const lectures = await seedLectures(courses, hallList);
    await seedAttendanceRecords(lectures, students);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("\n📋 Summary:");
    console.log(`   - Settings: ${defaultSettings.length}`);
    console.log(`   - Specializations: ${deptList.length}`);
    console.log(`   - Halls: ${hallList.length}`);
    console.log(`   - Admins: ${admins.length + deptList.length}`);
    console.log(`   - Doctors: ${doctors.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Lectures: ${lectures.length * 2}`);
    console.log("\n🔐 Login Credentials:");
    console.log("   Super Admin:     admin@smartattendance.edu / admin123456");
    console.log("   Dean:            dean@smartattendance.edu / admin123456");
    console.log("   Student Affairs: student.affairs@smartattendance.edu / admin123456");
    console.log("   CS HOD:          hod.cs@smartattendance.edu / admin123456");
    console.log("   Doctor:          doctor1@edu.eg / doctor123");
    console.log("   Student (Full):  student_full@student.edu / student123");
    console.log("   Student (Medium): student_medium@student.edu / student123");
    console.log("   Student (Empty):  student_empty@student.edu / student123");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeder
seed();

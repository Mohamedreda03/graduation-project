/**
 * Full System Database Seeder
 * Warning: This script will WIPE all existing data!
 * Run: node src/seeders/seed-full.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const config = require("../config/env");
const {
  ROLES,
  DAYS,
  ATTENDANCE_STATUS,
  WORKING_DAYS,
} = require("../config/constants");

// Models
const {
  User,
  Department,
  Hall,
  Course,
  Lecture,
  AttendanceRecord,
  StudentSession,
  ConnectionLog,
  Setting,
} = require("../models");

// ----------------------------------------------------------------------
// DATA DEFINITIONS
// ----------------------------------------------------------------------

const DEPARTMENTS = [
  {
    name: "علوم الحاسب",
    code: "CS",
    faculty: "كلية الحاسبات والذكاء الاصطناعي",
    description: "قسم علوم الحاسب",
  },
  {
    name: "نظم المعلومات",
    code: "IS",
    faculty: "كلية الحاسبات والذكاء الاصطناعي",
    description: "قسم نظم المعلومات",
  },
  {
    name: "تكنولوجيا المعلومات",
    code: "IT",
    faculty: "كلية الحاسبات والذكاء الاصطناعي",
    description: "قسم تكنولوجيا المعلومات",
  },
  {
    name: "الذكاء الاصطناعي",
    code: "AI",
    faculty: "كلية الحاسبات والذكاء الاصطناعي",
    description: "قسم الذكاء الاصطناعي",
  },
];

const HALLS = [
  {
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
  {
    name: "مدرج د. مجدي",
    building: "مبنى المدرجات",
    capacity: 300,
    accessPoint: {
      ssid: "Magdi-Hall-AP",
      ipRange: "192.168.3.0/24",
      apIdentifier: "AP-MAGDI-01",
      macAddress: "AA:BB:CC:DD:EE:03",
      isOnline: true,
    },
  },
  {
    name: "معمل 1",
    building: "مبنى المعامل",
    capacity: 30,
    accessPoint: {
      ssid: "Lab-1-AP",
      ipRange: "192.168.4.0/24",
      apIdentifier: "AP-LAB1-01",
      macAddress: "AA:BB:CC:DD:EE:04",
      isOnline: true,
    },
  },
  {
    name: "معمل 2",
    building: "مبنى المعامل",
    capacity: 30,
    accessPoint: {
      ssid: "Lab-2-AP",
      ipRange: "192.168.5.0/24",
      apIdentifier: "AP-LAB2-01",
      macAddress: "AA:BB:CC:DD:EE:05",
      isOnline: true,
    },
  },
];

const ADMINS = [
  {
    name: { first: "System", last: "Admin" },
    email: "admin@smartattendance.edu",
    password: "admin123456",
    role: ROLES.ADMIN,
    phone: "01000000000",
  },
];

const DOCTORS = [
  {
    name: { first: "د. محمد", last: "عبدالله" },
    email: "doctor1@edu.eg",
    password: "doctor123",
    role: ROLES.DOCTOR,
    phone: "01011111111",
  },
  {
    name: { first: "د. أحمد", last: "سالم" },
    email: "drahmed@edu.eg",
    password: "doctor123",
    role: ROLES.DOCTOR,
    phone: "01022222222",
  },
  {
    name: { first: "د. سارة", last: "حسن" },
    email: "drsara@edu.eg",
    password: "doctor123",
    role: ROLES.DOCTOR,
    phone: "01033333333",
  },
  {
    name: { first: "د. عمرو", last: "خالد" },
    email: "dramr@edu.eg",
    password: "doctor123",
    role: ROLES.DOCTOR,
    phone: "01044444444",
  },
];

// We will generate 50 students
const STUDENT_NAMES = [
  "محمد أحمد", "أحمد محمود", "علي حسن", "يوسف إبراهيم", "عمر خالد",
  "خالد مصطفى", "إبراهيم عادل", "حسن علي", "محمود سمير", "مصطفى كمال",
  "سارة محمد", "فاطمة أحمد", "مريم علي", "نور حسن", "آية محمود",
  "هدى إبراهيم", "منى خالد", "ليلى مصطفى", "هبة عادل", "سلمى سمير",
  "عبدالرحمن جمال", "كريم سعيد", "مازن طارق", "زياد وائل", "حمزة هشام",
  "جنى شريف", "ريتاج أسامة", "ملك يحيى", "فريدة تامر", "رنا مجدي"
];

const DEFAULT_SETTINGS = [
  {
    key: "MIN_PRESENCE_PERCENTAGE",
    value: 85,
    description: "النسبة المئوية الدنيا للحضور",
  },
  {
    key: "LATE_THRESHOLD_MINUTES",
    value: 15,
    description: "عدد الدقائق المسموح بها للتأخير قبل تسجيل الحالة كمتأخر",
  },
  {
    key: "AUTO_FINALIZE_AFTER_MINUTES",
    value: 30,
    description: "عدد الدقائق لإنهاء المحاضرة تلقائياً",
  },
];

// ----------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const generateMacAddress = () => {
  return "XX:XX:XX:XX:XX:XX".replace(/X/g, () => {
    return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
  });
};

// ----------------------------------------------------------------------
// SEED FUNCTION
// ----------------------------------------------------------------------

async function seed() {
  console.log("🚀 Starting Full Database Seed...");

  try {
    await mongoose.connect(config.mongodbUri);
    console.log("📦 Connected to MongoDB");

    // 1. Clear Database
    console.log("🧹 Clearing old data...");
    await User.deleteMany({});
    await Department.deleteMany({});
    await Hall.deleteMany({});
    await Course.deleteMany({});
    await Lecture.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await StudentSession.deleteMany({});
    await ConnectionLog.deleteMany({});
    await Setting.deleteMany({});

    // 2. Create Settings
    console.log("⚙️  Creating settings...");
    await Setting.insertMany(DEFAULT_SETTINGS);

    // 3. Create Departments
    console.log("🏢 Creating departments...");
    const createdDepts = await Department.create(DEPARTMENTS);
    const csDept = createdDepts.find((d) => d.code === "CS");
    const isDept = createdDepts.find((d) => d.code === "IS");

    // 4. Create Halls
    console.log("🏫 Creating halls...");
    const createdHalls = await Hall.create(HALLS);

    // 5. Create Users (Admin & Doctors)
    console.log("👨‍🏫 Creating admins and doctors...");
    await User.create(ADMINS);
    const createdDoctors = await User.create(DOCTORS);

    // 6. Create Students
    console.log("👨‍🎓 Creating students...");
    const studentsData = [];
    
    // Main Test Student
    studentsData.push({
      name: { first: "طالب", last: "تجريبي" },
      email: "student1@student.edu",
      password: "student123",
      studentId: "20240001",
      role: ROLES.STUDENT,
      academicInfo: {
        department: csDept._id,
        level: 3,
        specialization: "General",
      },
      device: {
        macAddress: "AA:BB:CC:DD:EE:FF", // Fixed MAC for testing
        isVerified: true,
        deviceId: "test-device-id",
        deviceName: "Test Phone",
      },
      isActive: true,
    });

    // Generate other students
    for (let i = 0; i < 49; i++) {
      const fullName = getRandomItem(STUDENT_NAMES);
      const [first, last] = fullName.split(" ");
      const dept = getRandomItem(createdDepts);
      const level = getRandomInt(1, 4);
      
      studentsData.push({
        name: { first, last },
        email: `s${20240002 + i}@student.edu`,
        password: "student123",
        studentId: `${20240002 + i}`,
        role: ROLES.STUDENT,
        academicInfo: {
          department: dept._id,
          level,
        },
        device: {
          macAddress: generateMacAddress(),
          isVerified: true,
          deviceId: `device-${i}`,
          deviceName: "Android Phone",
        },
        isActive: true,
      });
    }
    const createdStudents = await User.create(studentsData);

    // 7. Create Courses
    console.log("📚 Creating courses...");
    const coursesData = [
      {
        name: "هندسة البرمجيات",
        code: "CS351",
        department: csDept._id,
        doctor: createdDoctors[0]._id, // Dr. Mohamed Abdullah
        level: 3,
        semester: "Spring 2024",
      },
      {
        name: "الذكاء الاصطناعي",
        code: "CS361",
        department: csDept._id,
        doctor: createdDoctors[0]._id, // Dr. Mohamed Abdullah
        level: 3,
        semester: "Spring 2024",
      },
      {
        name: "قواعد البيانات",
        code: "IS211",
        department: isDept._id,
        doctor: createdDoctors[1]._id,
        level: 2,
        semester: "Spring 2024",
      },
      {
        name: "شبكات الحاسب",
        code: "IT321",
        department: csDept._id,
        doctor: createdDoctors[2]._id,
        level: 3,
        semester: "Spring 2024",
      },
      {
        name: "أمن المعلومات",
        code: "CS451",
        department: csDept._id,
        doctor: createdDoctors[3]._id,
        level: 4,
        semester: "Spring 2024",
      },
    ];
    const createdCourses = await Course.create(coursesData);

    // 8. Enroll Students
    console.log("📝 Enrolling students...");
    // Enroll the main test student in all level 3 CS courses
    const level3CsCourses = createdCourses.filter(c => c.level === 3);
    const testStudent = createdStudents[0];
    
    for (const course of level3CsCourses) {
      course.students.push(testStudent._id);
      testStudent.academicInfo.enrolledCourses.push(course._id);
    }
    await testStudent.save();

    // Randomly enroll other students
    for (const student of createdStudents.slice(1)) { // Skip first student
      const eligibleCourses = createdCourses.filter(c => c.level === student.academicInfo.level);
      for (const course of eligibleCourses) {
        if (Math.random() > 0.3) { // 70% chance to enroll
          course.students.push(student._id);
          student.academicInfo.enrolledCourses.push(course._id);
        }
      }
      await student.save();
    }
    
    // Save updated courses
    for (const course of createdCourses) {
      await course.save();
    }

    // 9. Create Lectures (Schedule)
    console.log("📅 Creating lectures schedule...");
    const lecturesData = [];
    const days = [DAYS.SUNDAY, DAYS.MONDAY, DAYS.TUESDAY, DAYS.WEDNESDAY, DAYS.THURSDAY];
    
    createdCourses.forEach((course, index) => {
      // Create 2 lectures per week for each course
      const hall1 = getRandomItem(createdHalls);
      const hall2 = getRandomItem(createdHalls);
      
      lecturesData.push({
        course: course._id,
        hall: hall1._id,
        doctor: course.doctor,
        dayOfWeek: days[index % 5],
        startTime: "09:00",
        endTime: "11:00",
        type: "lecture",
        lectureType: "lecture",
        status: "scheduled",
        isActive: true,
      });

      lecturesData.push({
        course: course._id,
        hall: hall2._id,
        doctor: course.doctor,
        dayOfWeek: days[(index + 2) % 5], // Different day
        startTime: "12:00",
        endTime: "14:00",
        type: "section",
        lectureType: "section",
        status: "scheduled",
        isActive: true,
      });
    });
    const createdLectures = await Lecture.create(lecturesData);

    // 10. Generate Attendance History (Last 4 weeks)
    console.log("📊 Generating attendance history...");
    const today = new Date();
    const attendanceRecords = [];

    // Helper to get date for previous weeks
    const getPreviousDate = (weeksBack, dayOfWeek) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (weeksBack * 7));
      const currentDay = d.getDay();
      const diff = dayOfWeek - currentDay;
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    for (let w = 1; w <= 4; w++) { // Last 4 weeks
      for (const lecture of createdLectures) {
        const lectureDate = getPreviousDate(w, lecture.dayOfWeek);
        
        // Skip future dates
        if (lectureDate > today) continue;

        const course = createdCourses.find(c => c._id.equals(lecture.course));
        if (!course) continue;

        for (const studentId of course.students) {
          // Determine status randomly
          // 80% Present, 10% Late, 10% Absent
          const rand = Math.random();
          let status = ATTENDANCE_STATUS.PRESENT;
          let presencePercentage = 100;
          let totalPresenceTime = 120; // 2 hours

          if (rand > 0.9) {
            status = ATTENDANCE_STATUS.ABSENT;
            presencePercentage = 0;
            totalPresenceTime = 0;
          } else if (rand > 0.8) {
            status = ATTENDANCE_STATUS.LATE;
            presencePercentage = 85;
            totalPresenceTime = 100;
          }

          // Special case for test student: Make him "At Risk" in one course
          if (studentId.equals(testStudent._id) && course.code === "CS361" && w > 2) {
             status = ATTENDANCE_STATUS.ABSENT;
             presencePercentage = 0;
             totalPresenceTime = 0;
          }

          attendanceRecords.push({
            student: studentId,
            course: course._id,
            lecture: lecture._id,
            hall: lecture.hall,
            date: lectureDate,
            status,
            presencePercentage,
            totalPresenceTime,
            isFinalized: true,
            checkInTime: status !== ATTENDANCE_STATUS.ABSENT ? new Date(lectureDate.setHours(9, 0)) : null,
            sessions: status !== ATTENDANCE_STATUS.ABSENT ? [{
              checkIn: new Date(lectureDate.setHours(9, 0)),
              checkOut: new Date(lectureDate.setHours(11, 0)),
            }] : [],
          });
        }
      }
    }
    await AttendanceRecord.create(attendanceRecords);

    console.log("\n🎉 Database Seeded Successfully!");
    console.log("-----------------------------------------");
    console.log("👤 Admin:    admin@smartattendance.edu / admin123456");
    console.log("👨‍🏫 Doctor:   doctor1@edu.eg / doctor123");
    console.log("👨‍🎓 Student:  student1@student.edu / student123");
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();

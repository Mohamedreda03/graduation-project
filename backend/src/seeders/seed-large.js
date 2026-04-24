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
  ATTENDANCE_STATUS,
  WORKING_DAYS,
} = require("../config/constants");

// Models
const User = require("../models/User");
const Department = require("../models/Department");
const Hall = require("../models/Hall");
const Course = require("../models/Course");
const Lecture = require("../models/Lecture");
const AttendanceRecord = require("../models/AttendanceRecord");
const Setting = require("../models/Setting");

// ========== SEED DATA ==========

// Default Settings
const defaultSettings = [
  {
    key: "MIN_PRESENCE_PERCENTAGE",
    value: 85,
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

// Departments
const departments = [
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

// Admin
const admin = {
  name: { first: "أحمد", last: "المدير" },
  email: "admin@smartattendance.edu",
  password: "admin123456",
  role: ROLES.ADMIN,
  isActive: true,
};

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

// Course names per department
const coursesByDepartment = {
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
    Department.deleteMany({}),
    Setting.deleteMany({}),
  ]);
  console.log("✅ Database cleared");
}

async function seedSettings() {
  console.log("⚙️  Seeding settings...");
  await Setting.insertMany(defaultSettings);
  console.log(`✅ Created ${defaultSettings.length} settings`);
}

async function seedDepartments() {
  console.log("🏛️  Seeding departments...");
  const created = await Department.insertMany(departments);
  console.log(`✅ Created ${created.length} departments`);
  return created;
}

async function seedHalls() {
  console.log("🚪 Seeding halls...");
  const created = await Hall.insertMany(halls);
  console.log(`✅ Created ${created.length} halls`);
  return created;
}

async function seedAdmin() {
  console.log("👨‍💼 Seeding admin...");
  await User.create(admin);
  console.log(`✅ Admin created: ${admin.email} / ${admin.password}`);
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
  const studentsPerDept = 50; // 50 students per department = 200 total

  let studentIndex = 1;
  for (const dept of deptList) {
    for (let i = 0; i < studentsPerDept; i++) {
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
          department: dept._id,
          level: level,
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
    "   Login credentials: student1@student.edu - student200@student.edu / student123",
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
    const deptCourses = coursesByDepartment[dept.code] || [];

    for (const courseData of deptCourses) {
      const doctor = doctors[doctorIndex % doctors.length];

      const course = await Course.create({
        name: courseData.name,
        code: courseData.code,
        department: dept._id,
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
    // Find students in the same department and level
    const eligibleStudents = students.filter(
      (s) =>
        s.academicInfo.department.toString() === course.department.toString() &&
        s.academicInfo.level === course.level,
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
      isActive: true,
    });
  }

  await Lecture.insertMany(lectures);
  console.log(`✅ Created ${lectures.length} lectures`);

  return await Lecture.find({});
}

async function seedAttendanceRecords(lectures, students) {
  console.log("📊 Seeding attendance records (this may take a while)...");
  const records = [];

  // Generate attendance for the past 4 weeks
  const today = new Date();
  const weeksToGenerate = 4;

  for (const lecture of lectures) {
    // Get course to find enrolled students
    const course = await Course.findById(lecture.course);
    if (!course || !course.students || course.students.length === 0) continue;

    // Generate records for each week
    for (let week = 0; week < weeksToGenerate; week++) {
      // Calculate the date for this lecture in this week
      const lectureDate = new Date(today);
      lectureDate.setDate(
        today.getDate() -
          week * 7 -
          ((today.getDay() - lecture.dayOfWeek + 7) % 7),
      );

      // Skip future dates
      if (lectureDate > today) continue;

      // Generate attendance for each enrolled student
      for (const studentId of course.students) {
        // Random attendance status (80% present, 10% late, 10% absent)
        const rand = Math.random();
        let status, presencePercentage, totalPresenceTime;

        if (rand < 0.1) {
          // Absent
          status = ATTENDANCE_STATUS.ABSENT;
          presencePercentage = 0;
          totalPresenceTime = 0;
        } else if (rand < 0.2) {
          // Present but low attendance (came late or left early)
          status = ATTENDANCE_STATUS.PRESENT;
          presencePercentage = randomInt(50, 84);
          totalPresenceTime = Math.floor((90 * presencePercentage) / 100);
        } else {
          // Present
          status = ATTENDANCE_STATUS.PRESENT;
          presencePercentage = randomInt(85, 100);
          totalPresenceTime = Math.floor((90 * presencePercentage) / 100);
        }

        records.push({
          student: studentId,
          lecture: lecture._id,
          course: course._id,
          hall: lecture.hall,
          date: lectureDate,
          sessions:
            status !== ATTENDANCE_STATUS.ABSENT
              ? [
                  {
                    checkIn: new Date(
                      lectureDate.setHours(
                        parseInt(lecture.startTime.split(":")[0]),
                        parseInt(lecture.startTime.split(":")[1]),
                      ),
                    ),
                    checkOut:
                      status === ATTENDANCE_STATUS.PRESENT
                        ? new Date(
                            lectureDate.setHours(
                              parseInt(lecture.endTime.split(":")[0]),
                              parseInt(lecture.endTime.split(":")[1]),
                            ),
                          )
                        : null,
                  },
                ]
              : [],
          totalPresenceTime: totalPresenceTime,
          lectureTime: 90,
          presencePercentage: presencePercentage,
          status: status,
          isFinalized: true,
          finalizedAt: lectureDate,
        });
      }
    }
  }

  // Batch insert in chunks for better performance
  const chunkSize = 1000;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    await AttendanceRecord.insertMany(chunk);
    console.log(
      `   Inserted ${Math.min(i + chunkSize, records.length)}/${records.length} records`,
    );
  }

  console.log(`✅ Created ${records.length} attendance records`);
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
    const deptList = await seedDepartments();
    const hallList = await seedHalls();
    await seedAdmin();
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
    console.log(`   - Departments: ${deptList.length}`);
    console.log(`   - Halls: ${hallList.length}`);
    console.log(`   - Doctors: ${doctors.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Lectures: ${lectures.length * 2}`);
    console.log("\n🔐 Login Credentials:");
    console.log("   Admin:   admin@smartattendance.edu / admin123456");
    console.log("   Doctor:  doctor1@edu.eg / doctor123");
    console.log("   Student: student1@student.edu / student123");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeder
seed();

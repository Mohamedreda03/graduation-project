const env = require("./env");
const isDev = env.nodeEnv === "development";

module.exports = {
  // User Roles
  ROLES: {
    STUDENT: "student",
    DOCTOR: "doctor",
    ADMIN: "admin",
  },

  // Admin Sub-Roles (Egyptian College System)
  ADMIN_ROLES: {
    SUPER_ADMIN: "super_admin", // IT / System Manager
    DEAN: "dean", // Dean / Vice Dean
    STUDENT_AFFAIRS: "student_affairs", // Student Affairs
    HEAD_OF_DEPT: "head_of_department", // Head of Department
  },

  // Attendance Status
  ATTENDANCE_STATUS: {
    IN_PROGRESS: "in-progress",
    PRESENT: "present",
    ABSENT: "absent",
    EXCUSED: "excused",
  },

  // Device Change Request Status
  DEVICE_REQUEST_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
  },

  // Connection Event Types
  CONNECTION_EVENTS: {
    CONNECTED: "device-connected",
    DISCONNECTED: "device-disconnected",
  },

  // Days of Week (الأسبوع يبدأ من السبت)
  // JavaScript Date.getDay() values: 0=Sunday, 1=Monday, ..., 6=Saturday
  DAYS: {
    SATURDAY: 6, // أول يوم في الأسبوع
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5, // آخر يوم (إجازة)
  },

  // Working days (أيام الدراسة)
  WORKING_DAYS: [6, 0, 1, 2, 3, 4, 5], // السبت للجمعة (مفتوح لجدولة المحاضرات في أي يوم)
};

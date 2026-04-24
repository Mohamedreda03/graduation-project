const User = require("./User");
const Department = require("./Department");
const Course = require("./Course");
const Hall = require("./Hall");
const Lecture = require("./Lecture");
const AttendanceRecord = require("./AttendanceRecord");
const ConnectionLog = require("./ConnectionLog");
const StudentSession = require("./StudentSession");
const RefreshToken = require("./RefreshToken");
const Setting = require("./Setting");

// Get Student and Doctor from User model with discriminators
const Student = User.discriminators?.Student || User;
const Doctor = User.discriminators?.Doctor || User;

module.exports = {
  User,
  Student,
  Doctor,
  Department,
  Course,
  Hall,
  Lecture,
  AttendanceRecord,
  ConnectionLog,
  StudentSession,
  RefreshToken,
  Setting,
};

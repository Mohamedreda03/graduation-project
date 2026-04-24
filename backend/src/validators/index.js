const authValidator = require("./auth.validator");
const usersValidator = require("./users.validator");
const studentsValidator = require("./students.validator");
const coursesValidator = require("./courses.validator");
const lecturesValidator = require("./lectures.validator");
const hallsValidator = require("./halls.validator");
const departmentsValidator = require("./departments.validator");
const connectionsValidator = require("./connections.validator");
const attendanceValidator = require("./attendance.validator");

module.exports = {
  authValidator,
  usersValidator,
  studentsValidator,
  coursesValidator,
  lecturesValidator,
  hallsValidator,
  departmentsValidator,
  connectionsValidator,
  attendanceValidator,
};

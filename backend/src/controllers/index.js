const authController = require("./auth.controller");
const usersController = require("./users.controller");
const studentsController = require("./students.controller");
const doctorsController = require("./doctors.controller");
const departmentsController = require("./departments.controller");
const coursesController = require("./courses.controller");
const hallsController = require("./halls.controller");
const lecturesController = require("./lectures.controller");
const attendanceController = require("./attendance.controller");
const connectionsController = require("./connections.controller");
const settingsController = require("./settings.controller");

module.exports = {
  authController,
  usersController,
  studentsController,
  doctorsController,
  departmentsController,
  coursesController,
  hallsController,
  lecturesController,
  attendanceController,
  connectionsController,
  settingsController,
};

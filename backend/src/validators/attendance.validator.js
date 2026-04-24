const Joi = require("joi");
const { ATTENDANCE_STATUS } = require("../config/constants");

// Get attendance query
const getAttendance = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(200).default(50),
    course: Joi.string().hex().length(24),
    date: Joi.date().iso(),
    status: Joi.string().valid(...Object.values(ATTENDANCE_STATUS)),
  }),
};

// Get my attendance query
const getMyAttendance = {
  query: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref("startDate")),
  }),
};

// Get attendance for course
const getMyAttendanceForCourse = {
  params: Joi.object({
    courseId: Joi.string().hex().length(24).required(),
  }),
};

// Get lecture attendance
const getLectureAttendance = {
  params: Joi.object({
    lectureId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    date: Joi.date().iso(),
  }),
};

// Get live attendance
const getLiveAttendance = {
  params: Joi.object({
    hallId: Joi.string().hex().length(24).required(),
  }),
};

module.exports = {
  getAttendance,
  getMyAttendance,
  getMyAttendanceForCourse,
  getLectureAttendance,
  getLiveAttendance,
};

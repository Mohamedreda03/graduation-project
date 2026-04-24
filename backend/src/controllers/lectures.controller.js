const {
  Lecture,
  Course,
  AttendanceRecord,
  StudentSession,
} = require("../models");
const { ROLES, ATTENDANCE_STATUS } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const { catchAsync, getCurrentTimeString } = require("../utils/helpers");

/**
 * Get all lectures
 * GET /api/lectures
 */
exports.getAllLectures = catchAsync(async (req, res, next) => {
  const { course, hall, doctor, dayOfWeek, level } = req.query;

  const query = { isActive: true };

  if (course) query.course = course;
  if (hall) query.hall = hall;
  if (doctor) query.doctor = doctor;
  if (dayOfWeek !== undefined) query.dayOfWeek = parseInt(dayOfWeek);
  if (level) query.level = parseInt(level);

  const lectures = await Lecture.find(query)
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name")
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.status(200).json({
    success: true,
    count: lectures.length,
    data: lectures,
  });
});

/**
 * Get single lecture
 * GET /api/lectures/:id
 */
exports.getLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id)
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name");

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  res.status(200).json({
    success: true,
    data: lecture,
  });
});

/**
 * Create lecture
 * POST /api/lectures
 */
exports.createLecture = catchAsync(async (req, res, next) => {
  const { course: courseId, hall, dayOfWeek, startTime, endTime } = req.body;

  // Check for conflicts (same hall, same day, overlapping time)
  const conflictingLecture = await Lecture.findOne({
    hall,
    dayOfWeek,
    isActive: true,
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });

  if (conflictingLecture) {
    throw ApiError.conflict(
      "There is already a lecture scheduled in this hall at this time",
    );
  }

  // Get course info for level and specialization
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const lectureData = {
    ...req.body,
    doctor: course.doctor,
    level: course.level,
    specialization: course.specialization,
  };

  const lecture = await Lecture.create(lectureData);

  res.status(201).json({
    success: true,
    data: lecture,
  });
});

/**
 * Update lecture
 * PUT /api/lectures/:id
 */
exports.updateLecture = catchAsync(async (req, res, next) => {
  const { hall, dayOfWeek, startTime, endTime } = req.body;

  // Check for conflicts if time/hall is being changed
  if (hall || dayOfWeek !== undefined || startTime || endTime) {
    const currentLecture = await Lecture.findById(req.params.id);

    const checkHall = hall || currentLecture.hall;
    const checkDay =
      dayOfWeek !== undefined ? dayOfWeek : currentLecture.dayOfWeek;
    const checkStart = startTime || currentLecture.startTime;
    const checkEnd = endTime || currentLecture.endTime;

    const conflictingLecture = await Lecture.findOne({
      _id: { $ne: req.params.id },
      hall: checkHall,
      dayOfWeek: checkDay,
      isActive: true,
      $or: [
        {
          startTime: { $lt: checkEnd },
          endTime: { $gt: checkStart },
        },
      ],
    });

    if (conflictingLecture) {
      throw ApiError.conflict(
        "There is already a lecture scheduled in this hall at this time",
      );
    }
  }

  const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  res.status(200).json({
    success: true,
    data: lecture,
  });
});

/**
 * Delete (deactivate) lecture
 * DELETE /api/lectures/:id
 */
exports.deleteLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  res.status(200).json({
    success: true,
    message: "Lecture deactivated successfully",
  });
});

/**
 * Get currently active lectures
 * GET /api/lectures/current
 */
exports.getCurrentLectures = catchAsync(async (req, res, next) => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = getCurrentTimeString();

  const lectures = await Lecture.find({
    dayOfWeek: currentDay,
    isActive: true,
    startTime: { $lte: currentTime },
    endTime: { $gte: currentTime },
  })
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name");

  res.status(200).json({
    success: true,
    count: lectures.length,
    data: lectures,
  });
});

/**
 * Get my schedule (for student or doctor)
 * GET /api/lectures/my-schedule
 */
exports.getMySchedule = catchAsync(async (req, res, next) => {
  const user = req.user;
  let lectures;

  if (user.role === ROLES.DOCTOR) {
    // Doctor's lectures
    lectures = await Lecture.find({ doctor: user._id, isActive: true })
      .populate("course", "name code")
      .populate("hall", "name building")
      .sort({ dayOfWeek: 1, startTime: 1 });
  } else if (user.role === ROLES.STUDENT) {
    // Get student's enrolled courses
    const courses = await Course.find({ students: user._id });
    const courseIds = courses.map((c) => c._id);

    lectures = await Lecture.find({
      course: { $in: courseIds },
      isActive: true,
    })
      .populate("course", "name code")
      .populate("hall", "name building")
      .populate("doctor", "name")
      .sort({ dayOfWeek: 1, startTime: 1 });
  } else {
    lectures = [];
  }

  // Group by day
  const schedule = {
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: [], // Saturday
  };

  for (const lecture of lectures) {
    schedule[lecture.dayOfWeek].push(lecture);
  }

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

/**
 * Get today's lectures
 * GET /api/lectures/today
 */
exports.getTodayLectures = catchAsync(async (req, res, next) => {
  const now = new Date();
  const currentDay = now.getDay();

  const lectures = await Lecture.find({
    dayOfWeek: currentDay,
    isActive: true,
  })
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name")
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    count: lectures.length,
    data: lectures,
  });
});

/**
 * Get lectures by date
 * GET /api/lectures/by-date?date=2024-01-15
 */
exports.getLecturesByDate = catchAsync(async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    throw ApiError.badRequest("Date parameter is required");
  }

  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  const lectures = await Lecture.find({
    dayOfWeek,
    isActive: true,
  })
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name")
    .sort({ startTime: 1 });

  res.status(200).json({
    success: true,
    count: lectures.length,
    data: lectures,
  });
});

/**
 * Get week schedule (optionally filtered by course or hall)
 * GET /api/lectures/week-schedule?course=xxx&hall=xxx
 */
exports.getWeekSchedule = catchAsync(async (req, res, next) => {
  const { course, hall } = req.query;

  const query = { isActive: true };
  if (course) query.course = course;
  if (hall) query.hall = hall;

  const lectures = await Lecture.find(query)
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name")
    .sort({ dayOfWeek: 1, startTime: 1 });

  // Group by day
  const schedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const lecture of lectures) {
    schedule[lecture.dayOfWeek].push(lecture);
  }

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

/**
 * Schedule recurring lectures
 * POST /api/lectures/schedule
 */
exports.scheduleRecurring = catchAsync(async (req, res, next) => {
  const {
    course: courseId,
    hall,
    dayOfWeek,
    startTime,
    endTime,
    startDate,
    endDate,
  } = req.body;

  if (!courseId || !hall || dayOfWeek === undefined || !startTime || !endTime) {
    throw ApiError.badRequest(
      "course, hall, dayOfWeek, startTime, and endTime are required",
    );
  }

  // Check for conflicts
  const conflictingLecture = await Lecture.findOne({
    hall,
    dayOfWeek,
    isActive: true,
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
  });

  if (conflictingLecture) {
    throw ApiError.conflict(
      "There is already a lecture scheduled in this hall at this time",
    );
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  const lectureData = {
    ...req.body,
    course: courseId,
    doctor: course.doctor,
    level: course.level,
    specialization: course.specialization,
  };
  // Remove date fields that aren't part of Lecture schema
  delete lectureData.startDate;
  delete lectureData.endDate;

  const lecture = await Lecture.create(lectureData);

  res.status(201).json({
    success: true,
    data: { created: 1, lecture },
  });
});

/**
 * Start a lecture manually
 * POST /api/lectures/:id/start
 */
exports.startLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id)
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name");

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  lecture.status = "in-progress";
  lecture.isActive = true;
  await lecture.save();

  res.status(200).json({
    success: true,
    data: lecture,
  });
});

/**
 * End a lecture manually
 * POST /api/lectures/:id/end
 */
exports.endLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id)
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name");

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  lecture.status = "completed";
  await lecture.save();

  // 1. Finalize all attendance records for this lecture that are still "in-progress"
  const records = await AttendanceRecord.find({
    lecture: lecture._id,
    status: ATTENDANCE_STATUS.IN_PROGRESS,
  });

  const now = new Date();

  for (const record of records) {
    record.status = ATTENDANCE_STATUS.PRESENT;

    // Close any open sessions within the record
    if (record.sessions && record.sessions.length > 0) {
      const lastSession = record.sessions[record.sessions.length - 1];
      if (!lastSession.checkOut) {
        lastSession.checkOut = now;

        // Calculate minutes if possible (usually record has calculateMinutes helper or similar)
        const diffMs = now - lastSession.checkIn;
        const diffMins = Math.floor(diffMs / 1000 / 60);
        lastSession.duration = diffMins;
        record.totalPresenceTime += diffMins;
      }
    }
    await record.save();
  }

  // 2. Finalize all student sessions in this hall for this lecture
  await StudentSession.updateMany(
    {
      currentLecture: lecture._id,
      isActive: true,
    },
    {
      isActive: false,
      disconnectedAt: now,
    },
  );

  res.status(200).json({
    success: true,
    data: lecture,
    finalizedRecords: records.length,
  });
});

/**
 * Cancel a lecture
 * POST /api/lectures/:id/cancel
 */
exports.cancelLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  lecture.status = "cancelled";
  lecture.isActive = false;
  await lecture.save();

  res.status(200).json({
    success: true,
    message: "Lecture cancelled successfully",
  });
});

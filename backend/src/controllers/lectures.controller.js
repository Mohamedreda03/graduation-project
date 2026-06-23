const {
  Lecture,
  Course,
  AttendanceRecord,
  StudentSession,
  Specialization,
  Setting,
} = require("../models");
const { ROLES, ATTENDANCE_STATUS } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const { catchAsync, getCurrentTimeString, getTodayDate } = require("../utils/helpers");

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
    .populate({
      path: "course",
      select: "name code specialization students",
      populate: {
        path: "specialization",
        select: "name code"
      }
    })
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
    .populate({
      path: "course",
      select: "name code students",
      populate: {
        path: "students",
        select: "name studentId",
      },
    })
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
      .populate({
        path: "course",
        select: "name code specialization level departments",
        populate: {
          path: "specialization",
          select: "name code faculty",
        },
      })
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
      .populate({
        path: "course",
        select: "name code specialization level departments",
        populate: {
          path: "specialization",
          select: "name code faculty",
        },
      })
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
    .populate({
      path: "course",
      select: "name code students",
      populate: {
        path: "students",
        select: "name studentId",
      },
    })
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
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest("Invalid date format");
  }

  const dayOfWeek = targetDate.getDay();
  const targetDateNormalized = new Date(targetDate);
  targetDateNormalized.setHours(0, 0, 0, 0);

  const lectures = await Lecture.find({
    dayOfWeek,
    isActive: true,
  })
    .populate({
      path: "course",
      select: "name code students",
      populate: {
        path: "students",
        select: "name studentId",
      },
    })
    .populate("hall", "name building")
    .populate("doctor", "name")
    .sort({ startTime: 1 });

  // Get attendance records for this date to determine actual status
  const records = await AttendanceRecord.find({
    date: targetDateNormalized,
  });

  const lecturesWithStatus = lectures.map((lecture) => {
    const lectureObj = lecture.toObject();
    const lectureRecords = records.filter(
      (r) => r.lecture.toString() === lecture._id.toString()
    );

    if (lectureRecords.length > 0) {
      // If any attendance record is in-progress, the lecture is in-progress
      const hasInProgress = lectureRecords.some(
        (r) => r.status === "in-progress"
      );
      if (hasInProgress) {
        lectureObj.status = "in-progress";
      } else {
        lectureObj.status = "completed";
      }

      // Gather actual doctor start & end times from student records
      let earliestStart = null;
      let latestEnd = null;

      for (const record of lectureRecords) {
        if (record.lectureStartTime) {
          const st = new Date(record.lectureStartTime);
          if (!earliestStart || st < earliestStart) {
            earliestStart = st;
          }
        }
        if (record.lectureEndTime) {
          const et = new Date(record.lectureEndTime);
          if (!latestEnd || et > latestEnd) {
            latestEnd = et;
          }
        }
      }

      if (earliestStart) lectureObj.actualStartTime = earliestStart;
      if (latestEnd) lectureObj.actualEndTime = latestEnd;
    } else {
      lectureObj.status = "scheduled";
      lectureObj.actualStartTime = null;
      lectureObj.actualEndTime = null;
    }

    return lectureObj;
  });

  res.status(200).json({
    success: true,
    count: lecturesWithStatus.length,
    data: lecturesWithStatus,
  });
});

/**
 * Get week schedule (optionally filtered by course or hall)
 * GET /api/lectures/week-schedule?course=xxx&hall=xxx
 */
exports.getWeekSchedule = catchAsync(async (req, res, next) => {
  const { course, hall, specialization, faculty, department, level, section } = req.query;

  const query = { isActive: true };
  if (course) query.course = course;
  if (hall) query.hall = hall;
  if (level) query.level = parseInt(level);
  if (section) query.section = section;

  if (specialization || faculty) {
    let specQuery = {};
    if (specialization) specQuery._id = specialization;
    if (faculty) specQuery.faculty = faculty;

    const specializations = await Specialization.find(specQuery);
    const specIds = specializations.map((s) => s._id);

    let courseQuery = { specialization: { $in: specIds } };
    if (department) {
      courseQuery.$or = [
        { departments: department },
        { departments: { $size: 0 } },
        { departments: { $exists: false } }
      ];
    }

    const courses = await Course.find(courseQuery);
    const courseIds = courses.map((c) => c._id);

    if (query.course) {
      const courseIdStr = query.course.toString();
      const belongs = courseIds.some((cId) => cId.toString() === courseIdStr);
      if (!belongs) {
        query.course = null;
      }
    } else {
      query.course = { $in: courseIds };
    }
  }

  const lectures = await Lecture.find(query)
    .populate({
      path: "course",
      select: "name code specialization level",
      populate: {
        path: "specialization",
        select: "name code faculty",
      },
    })
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
    .populate("course")
    .populate("hall", "name building")
    .populate("doctor", "name");

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  lecture.status = "in-progress";
  lecture.isActive = true;
  lecture.actualStartTime = new Date();
  await lecture.save();

  // Set the start time on all existing attendance records for today
  await AttendanceRecord.updateMany(
    { lecture: lecture._id, date: getTodayDate() },
    { $set: { lectureStartTime: lecture.actualStartTime } }
  );

  // Find all students currently connected to this hall (active sessions)
  const activeSessions = await StudentSession.find({
    currentHall: lecture.hall._id,
    isActive: true,
  });

  const now = new Date();
  const courseStudents = lecture.course?.students || [];

  for (const session of activeSessions) {
    const isEnrolled = courseStudents.some(
      (s) => s.toString() === session.student.toString()
    );

    if (isEnrolled) {
      // Find or create attendance record
      let attendanceRecord = await AttendanceRecord.findOne({
        student: session.student,
        lecture: lecture._id,
        date: getTodayDate(),
      });

      if (!attendanceRecord) {
        attendanceRecord = await AttendanceRecord.create({
          student: session.student,
          course: lecture.course._id,
          lecture: lecture._id,
          hall: lecture.hall._id,
          date: getTodayDate(),
          status: ATTENDANCE_STATUS.IN_PROGRESS,
          sessions: [{ checkIn: now }],
          lectureStartTime: lecture.actualStartTime,
        });
        console.log(`[Auto-Start] Attendance record created for student ${session.student} on lecture ${lecture._id}`);
      }

      // Link session to attendance record
      session.currentLecture = lecture._id;
      session.attendanceRecord = attendanceRecord._id;
      await session.save();
    }
  }

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
  lecture.actualEndTime = new Date();
  await lecture.save();

  // Set the end time on all attendance records for today (both finalized and in-progress/absent)
  await AttendanceRecord.updateMany(
    { lecture: lecture._id, date: getTodayDate() },
    { $set: { lectureEndTime: lecture.actualEndTime } }
  );

  // 1. Finalize all attendance records for this lecture that are still "in-progress"
  const records = await AttendanceRecord.find({
    lecture: lecture._id,
    status: ATTENDANCE_STATUS.IN_PROGRESS,
  });

  const now = new Date();

  // Load min presence percentage setting
  const minPresenceSetting = await Setting.findOne({ key: "MIN_PRESENCE_PERCENTAGE" });
  const minPresencePercentage = minPresenceSetting ? parseInt(minPresenceSetting.value) : 50;

  // Calculate actual lecture duration in minutes
  const lectureStartTime = lecture.actualStartTime || new Date(lecture.createdAt);
  const actualDuration = Math.round((lecture.actualEndTime - lectureStartTime) / 60000);
  const lectureDuration = Math.max(1, actualDuration); // Use actual elapsed time, minimum 1 min

  for (const record of records) {
    record.lectureEndTime = lecture.actualEndTime;

    // Close any open sessions within the record
    if (record.sessions && record.sessions.length > 0) {
      const lastSession = record.sessions[record.sessions.length - 1];
      if (!lastSession.checkOut) {
        lastSession.checkOut = now;

        const diffMs = now - lastSession.checkIn;
        const diffMins = Math.floor(diffMs / 1000 / 60);
        lastSession.duration = Math.max(0, diffMins);
        record.totalPresenceTime += lastSession.duration;
      }
    }

    // Calculate presence percentage
    const presencePercentage = lectureDuration > 0
      ? (record.totalPresenceTime / lectureDuration) * 100
      : 0;

    record.presencePercentage = Math.min(Math.round(presencePercentage), 100);

    // Determine final status
    if (record.presencePercentage >= minPresencePercentage) {
      record.status = ATTENDANCE_STATUS.PRESENT;
    } else {
      record.status = ATTENDANCE_STATUS.ABSENT;
    }

    record.isFinalized = true;
    record.finalizedAt = now;

    await record.save();
  }

  // 2. Log that sessions for connected students remain active to allow auto-transition to consecutive lectures
  console.log(`[endLecture] Completed finalization of attendance records for lecture ${lecture._id}. Sessions for physically connected students remain active.`);

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

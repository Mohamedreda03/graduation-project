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
const { catchAsync, getCurrentTimeString, getTodayDate, getLocalTime } = require("../utils/helpers");

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
 * Helper to check for lecture conflicts (Hall, Doctor, Students/Section)
 */
const checkLectureConflicts = async (lectureData, excludeLectureId = null) => {
  const { hall, doctor, courseId, dayOfWeek, startTime, endTime, section } = lectureData;
  const reqSection = section || "all";

  // Validate time logic
  if (startTime >= endTime) {
    throw ApiError.badRequest("وقت الانتهاء يجب أن يكون بعد وقت البداية");
  }

  // Find all active overlapping lectures on the same day
  const query = {
    dayOfWeek,
    isActive: true,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
    ],
  };

  if (excludeLectureId) {
    query._id = { $ne: excludeLectureId };
  }

  const overlappingLectures = await Lecture.find(query).populate("course hall doctor");

  if (overlappingLectures.length === 0) return;

  // Get the new course details
  const newCourse = await Course.findById(courseId);
  if (!newCourse) throw ApiError.notFound("المقرر غير موجود");

  const newDepts = newCourse.departments || [];
  const newSpec = newCourse.specialization.toString();
  const newLevel = newCourse.level;

  for (const existing of overlappingLectures) {
    // 1. Hall Conflict
    if (existing.hall._id.toString() === hall.toString()) {
      const courseName = existing.course ? existing.course.name : "مادة أخرى";
      throw ApiError.conflict(`القاعة ${existing.hall.name} مشغولة بالفعل بمحاضرة (${courseName}) في هذا الوقت`);
    }

    // 2. Doctor Conflict
    if (existing.doctor && existing.doctor._id.toString() === doctor.toString()) {
      throw ApiError.conflict(`المحاضر (${existing.doctor.name}) لديه محاضرة أخرى في نفس التوقيت في قاعة ${existing.hall.name}`);
    }

    // 3. Student / Section Conflict
    if (existing.course) {
      const existingSpec = existing.course.specialization.toString();
      const existingLevel = existing.course.level;
      
      if (existingSpec === newSpec && existingLevel === newLevel) {
        const existingDepts = existing.course.departments || [];
        
        const isGeneral = existingDepts.length === 0 || newDepts.length === 0;
        const shareDept = existingDepts.some(d => newDepts.includes(d));

        if (isGeneral || shareDept) {
          const existingSec = existing.section || "all";
          
          if (existingSec === "all" || reqSection === "all" || existingSec === reqSection) {
             const deptMsg = isGeneral ? "الفرقة كاملة" : "هذا القسم";
             const secMsg = (existingSec === "all" || reqSection === "all") ? "محاضرة مجمعة" : `سكشن ${existingSec}`;
             throw ApiError.conflict(`يوجد تعارض للطلاب: ${deptMsg} لديهم ${secMsg} لمادة (${existing.course.name}) في نفس الوقت`);
          }
        }
      }
    }
  }
};

/**
 * Create lecture
 * POST /api/lectures
 */
exports.createLecture = catchAsync(async (req, res, next) => {
  const { course: courseId, hall, dayOfWeek, startTime, endTime, section } = req.body;

  // Get course info for level and specialization
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // Check all conflicts
  await checkLectureConflicts({
    hall,
    doctor: course.doctor,
    courseId,
    dayOfWeek,
    startTime,
    endTime,
    section
  });

  const lectureData = {
    ...req.body,
    doctor: course.doctor,
    level: course.level,
    specialization: course.specialization,
    // Auto-derive semester from Course (take first semester if array)
    semester: Array.isArray(course.semester)
      ? course.semester[0]
      : course.semester,
  };

  // Remove semester if it was manually sent (we ignore it)
  // lectureData already has the correct value

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
  const { hall, dayOfWeek, startTime, endTime, section, course: newCourseId } = req.body;

  const currentLecture = await Lecture.findById(req.params.id).populate("course");
  if (!currentLecture) {
    throw ApiError.notFound("Lecture not found");
  }

  const checkCourseId = newCourseId || currentLecture.course._id;
  const course = await Course.findById(checkCourseId);
  if (!course) throw ApiError.notFound("Course not found");

  const checkHall = hall || currentLecture.hall;
  const checkDay = dayOfWeek !== undefined ? dayOfWeek : currentLecture.dayOfWeek;
  const checkStart = startTime || currentLecture.startTime;
  const checkEnd = endTime || currentLecture.endTime;
  const checkSection = section || currentLecture.section;

  // Check all conflicts (excluding this lecture itself)
  await checkLectureConflicts({
    hall: checkHall,
    doctor: course.doctor,
    courseId: checkCourseId,
    dayOfWeek: checkDay,
    startTime: checkStart,
    endTime: checkEnd,
    section: checkSection
  }, req.params.id);

  const updateData = {
    ...req.body,
    doctor: course.doctor,
    level: course.level,
    specialization: course.specialization,
    // Keep semester in sync with the course (auto-derived)
    semester: Array.isArray(course.semester)
      ? course.semester[0]
      : course.semester,
  };

  const lecture = await Lecture.findByIdAndUpdate(req.params.id, updateData, {
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

exports.getCurrentLectures = catchAsync(async (req, res, next) => {
  const now = getLocalTime();
  const currentDay = now.getDay();
  const yesterday = (currentDay - 1 + 7) % 7;
  const currentTime = getCurrentTimeString();

  const lectures = await Lecture.find({
    dayOfWeek: { $in: [currentDay, yesterday] },
    isActive: true,
  })
    .populate("course", "name code")
    .populate("hall", "name building")
    .populate("doctor", "name");

  const activeLectures = lectures.filter(lecture => {
    const [startH, startM] = lecture.startTime.split(":").map(Number);
    const [endH, endM] = lecture.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const spansMidnight = startMinutes > endMinutes;

    const [curH, curM] = currentTime.split(":").map(Number);
    const curMinutes = curH * 60 + curM;

    if (lecture.dayOfWeek === currentDay) {
      if (!spansMidnight) {
        return curMinutes >= startMinutes && curMinutes <= endMinutes;
      } else {
        return curMinutes >= startMinutes || curMinutes <= endMinutes;
      }
    } else if (lecture.dayOfWeek === yesterday) {
      return spansMidnight && curMinutes <= endMinutes;
    }
    return false;
  });

  res.status(200).json({
    success: true,
    count: activeLectures.length,
    data: activeLectures,
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
  const now = getLocalTime();
  const currentDay = now.getDay();
  const yesterday = (currentDay - 1 + 7) % 7;

  const lectures = await Lecture.find({
    dayOfWeek: { $in: [currentDay, yesterday] },
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

  const filtered = lectures.filter(lecture => {
    if (lecture.dayOfWeek === currentDay) return true;
    if (lecture.dayOfWeek === yesterday) {
      const [startH, startM] = lecture.startTime.split(":").map(Number);
      const [endH, endM] = lecture.endTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const spansMidnight = startMinutes > endMinutes;
      if (!spansMidnight) return false;

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return currentMinutes <= endMinutes || lecture.status === "in-progress";
    }
    return false;
  });

  res.status(200).json({
    success: true,
    count: filtered.length,
    data: filtered,
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

  const [yyyy, mm, dd] = date.split("-").map(Number);
  const targetDateNormalized = new Date(`${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T00:00:00Z`);
  
  if (isNaN(targetDateNormalized.getTime())) {
    throw ApiError.badRequest("Invalid date format");
  }

  const dayOfWeek = targetDateNormalized.getUTCDay();

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
  const { course, hall, specialization, department, level, section, semester } = req.query;

  const query = { isActive: true };
  if (course) query.course = course;
  if (hall) query.hall = hall;
  if (section) query.section = section;
  if (semester) query.semester = semester;

  if (specialization || department || level || semester) {
    const courseQuery = {};
    if (specialization) courseQuery.specialization = specialization;
    if (level) courseQuery.level = parseInt(level);
    if (semester) courseQuery.semester = semester;
    if (department) {
      courseQuery.$or = [
        { departments: department },
        { departments: { $size: 0 } },
        { departments: { $exists: false } }
      ];
    }
    const courses = await Course.find(courseQuery).select("_id");
    const courseIds = courses.map((c) => c._id);

    if (query.course) {
      // A specific course was also requested — make sure it belongs to this specialization
      const courseIdStr = query.course.toString();
      const belongs = courseIds.some((cId) => cId.toString() === courseIdStr);
      if (!belongs) {
        // The requested course doesn't belong to this specialization → return empty
        query.course = null;
      }
    } else {
      if (department) {
        // If department is specified, we must strictly filter by the matched courses
        query.course = { $in: courseIds };
      } else {
        query.$or = [
          { specialization: specialization },
          { course: { $in: courseIds } },
        ];
      }
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
    .populate("hall", "name building accessPoint")
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

  // Check if AP is currently active (heartbeat within last 3 minutes)
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
  const isApOnline = 
    lecture.hall.accessPoint && 
    lecture.hall.accessPoint.lastSeen && 
    lecture.hall.accessPoint.lastSeen > threeMinutesAgo;

  if (!isApOnline) {
    console.log(`[startLecture] Hall AP is offline (last seen: ${lecture.hall.accessPoint?.lastSeen}). Deactivating stale sessions...`);
    // Deactivate all stale sessions for this hall to prevent ghost attendance
    await StudentSession.updateMany(
      { currentHall: lecture.hall._id, isActive: true },
      { $set: { isActive: false, disconnectedAt: new Date() } }
    );
  }

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
      // Find or create attendance record using atomic upsert to prevent race conditions
      let attendanceRecord = await AttendanceRecord.findOneAndUpdate(
        {
          student: session.student,
          lecture: lecture._id,
          date: getTodayDate(),
        },
        {
          $setOnInsert: {
            student: session.student,
            course: lecture.course._id,
            lecture: lecture._id,
            hall: lecture.hall._id,
            date: getTodayDate(),
            status: ATTENDANCE_STATUS.IN_PROGRESS,
            sessions: [{ checkIn: now }],
            lectureStartTime: lecture.actualStartTime,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`[Auto-Start] Attendance record ensured for student ${session.student} on lecture ${lecture._id}`);

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
    .populate("course", "name code students")
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

        // Cap checkIn time to actual lecture start time to avoid counting early connection minutes
        let effectiveCheckIn = new Date(lastSession.checkIn);
        if (lecture.actualStartTime && effectiveCheckIn < lecture.actualStartTime) {
          effectiveCheckIn = new Date(lecture.actualStartTime);
        }

        const diffMs = now - effectiveCheckIn;
        const diffMins = Math.round(diffMs / 1000 / 60);
        lastSession.duration = Math.max(0, diffMins);
        record.totalPresenceTime += lastSession.duration;
      }
    }

    // Cap totalPresenceTime to lectureDuration to prevent impossible values
    const cappedPresenceTime = Math.min(record.totalPresenceTime, lectureDuration);

    // Calculate presence percentage
    const presencePercentage = lectureDuration > 0
      ? (cappedPresenceTime / lectureDuration) * 100
      : 0;

    record.presencePercentage = Math.min(Math.round(presencePercentage), 100);
    record.totalPresenceTime = cappedPresenceTime;

    // Determine final status
    let finalStatus = ATTENDANCE_STATUS.ABSENT;
    if (record.presencePercentage >= minPresencePercentage) {
      finalStatus = ATTENDANCE_STATUS.PRESENT;
    }

    await AttendanceRecord.updateOne(
      { _id: record._id },
      {
        $set: {
          status: finalStatus,
          presencePercentage: record.presencePercentage,
          isFinalized: true,
          finalizedAt: now,
          totalPresenceTime: record.totalPresenceTime, // already capped above
          lectureEndTime: lecture.actualEndTime,
          sessions: record.sessions
        }
      }
    );
  }

  // 2. Create absent records for enrolled students who never joined
  const allRecords = await AttendanceRecord.find({
    lecture: lecture._id,
    date: getTodayDate(),
  });
  const allRecordStudentIds = new Set(allRecords.map(r => r.student.toString()));
  const enrolledStudents = lecture.course?.students || [];

  const missingStudents = enrolledStudents.filter(
    sId => !allRecordStudentIds.has(sId.toString())
  );

  if (missingStudents.length > 0) {
    const newAbsentRecords = missingStudents.map(studentId => ({
      student: studentId,
      course: lecture.course._id,
      lecture: lecture._id,
      hall: lecture.hall._id,
      date: getTodayDate(),
      status: ATTENDANCE_STATUS.ABSENT,
      isFinalized: true,
      finalizedAt: now,
      lectureStartTime: lecture.actualStartTime,
      lectureEndTime: lecture.actualEndTime,
      presencePercentage: 0,
      totalPresenceTime: 0,
      sessions: []
    }));

    await AttendanceRecord.insertMany(newAbsentRecords);
    console.log(`[endLecture] Created ${newAbsentRecords.length} absent records for students who never joined.`);
  }

  // 3. Close all active StudentSessions linked to this lecture to prevent ghost attendance
  // in the next lecture. Sessions remain recorded but are marked inactive.
  await StudentSession.updateMany(
    { currentLecture: lecture._id, isActive: true },
    {
      $set: {
        isActive: false,
        disconnectedAt: now,
      },
    }
  );

  // 4. Log finalization summary
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
  await lecture.save();

  res.status(200).json({
    success: true,
    message: "Lecture cancelled successfully",
  });
});

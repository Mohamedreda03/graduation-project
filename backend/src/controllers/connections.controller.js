const {
  ConnectionLog,
  StudentSession,
  AttendanceRecord,
  User,
  Lecture,
  Hall,
  Setting,
} = require("../models");
const {
  CONNECTION_EVENTS,
  ATTENDANCE_STATUS,
  ROLES,
} = require("../config/constants");
const ApiError = require("../utils/ApiError");
const {
  catchAsync,
  getTodayDate,
  calculateMinutes,
  normalizeMacAddress,
  paginationResponse,
} = require("../utils/helpers");

/**
 * Handle connection event from Access Point
 * POST /api/connections/event
 */
exports.handleConnectionEvent = catchAsync(async (req, res, next) => {
  const { eventType, apMacAddress, apIdentifier, timestamp } = req.body;
  // Normalize MAC address to consistent XX:XX:XX:XX:XX:XX format
  const macAddress = normalizeMacAddress(req.body.macAddress);

  console.log("\n========== [AP EVENT] ==========");
  console.log("Event Type   :", eventType);
  console.log("AP Identifier:", apIdentifier);
  console.log("MAC Address  :", macAddress);
  console.log("Raw MAC      :", req.body.macAddress);
  console.log("Timestamp    :", timestamp);
  console.log("================================\n");

  // Handle heartbeat events (just update AP status)
  if (eventType === "heartbeat") {
    // AP status is updated in the middleware (verifyAccessPoint)
    return res.status(200).json({
      success: true,
      message: "Heartbeat received",
    });
  }

  // Find the hall by access point identifier or MAC address
  let hall = null;
  if (apIdentifier) {
    hall = await Hall.findOne({ "accessPoint.apIdentifier": apIdentifier });
    console.log(
      "[HALL LOOKUP] By apIdentifier:",
      apIdentifier,
      "=>",
      hall ? `Found: ${hall.name}` : "NOT FOUND",
    );
  }
  if (!hall && apMacAddress) {
    hall = await Hall.findOne({ "accessPoint.macAddress": apMacAddress });
    console.log(
      "[HALL LOOKUP] By apMacAddress:",
      apMacAddress,
      "=>",
      hall ? `Found: ${hall.name}` : "NOT FOUND",
    );
  }
  // Also check if hall was attached by middleware
  if (!hall && req.hall) {
    hall = req.hall;
    console.log("[HALL LOOKUP] From middleware:", hall.name);
  }

  if (!hall) {
    console.log(
      "[ERROR] No hall found for this AP. Check that apIdentifier matches Hall.accessPoint.apIdentifier in DB.",
    );
    return next(new ApiError("Access Point not registered", 404));
  }

  console.log("[HALL] Found hall:", hall.name, "(id:", hall._id, ")");

  // Update AP online status
  await hall.updateApStatus(true);

  // Log the connection event
  const connectionLog = await ConnectionLog.create({
    macAddress,
    hall: hall._id,
    eventType,
    timestamp: timestamp || new Date(),
    processed: false,
  });

  // Find student by MAC address
  const student = await User.findByDeviceIdentifier(macAddress);
  console.log(
    "[STUDENT LOOKUP] By MAC:",
    macAddress,
    "=>",
    student ? `Found: ${student.studentId}` : "NOT FOUND",
  );

  if (!student) {
    // Also try to find by any matching MAC to help debug
    const anyUser = await User.findOne({ "device.macAddress": macAddress });
    console.log(
      "[DEBUG] findOne device.macAddress raw =>",
      anyUser
        ? `Found (isVerified: ${anyUser.device?.isVerified})`
        : "NOT FOUND at all",
    );

    connectionLog.processed = true;
    connectionLog.processingResult = "Student not found for this MAC address";
    await connectionLog.save();

    return res.status(200).json({
      success: true,
      message: "Event logged, but no student found for this MAC address",
    });
  }

  console.log(
    "[STUDENT] Found:",
    student.studentId,
    "| device.isVerified:",
    student.device?.isVerified,
  );

  // Process based on event type
  if (eventType === CONNECTION_EVENTS.CONNECTED) {
    await handleConnect(student, hall, macAddress, connectionLog);
  } else if (eventType === CONNECTION_EVENTS.DISCONNECTED) {
    await handleDisconnect(student, hall, connectionLog);
  }

  res.status(200).json({
    success: true,
    message: "Connection event processed",
    data: {
      student: student.studentId,
      hall: hall.name,
      eventType,
    },
  });
});

/**
 * Handle student connect event
 */
async function handleConnect(student, hall, macAddress, connectionLog) {
  const now = new Date();

  console.log("\n--- [handleConnect] START ---");
  console.log("Student:", student.studentId, "| Hall:", hall.name);

  // Create or update student session
  let session = await StudentSession.findOne({
    student: student._id,
    isActive: true,
  });

  if (session) {
    // Update existing session
    session.currentHall = hall._id;
    session.connectedAt = now;
    session.macAddress = macAddress;
    await session.save();
    console.log("[SESSION] Updated existing session");
  } else {
    // Create new session
    session = await StudentSession.create({
      student: student._id,
      currentHall: hall._id,
      macAddress,
      connectedAt: now,
      isActive: true,
    });
    console.log("[SESSION] Created new session");
  }

  // Find active lecture in this hall
  const activeLecture = await Lecture.findActiveLecture(hall._id);
  console.log(
    "[LECTURE] findActiveLecture =>",
    activeLecture
      ? `Found: ${activeLecture._id} | course: ${activeLecture.course?.name} | status: ${activeLecture.status}`
      : "NO ACTIVE LECTURE FOUND",
  );

  if (activeLecture) {
    // Check if student is enrolled in this course
    const courseStudents = activeLecture.course.students || [];
    const studentIdStr = student._id.toString();
    const isEnrolled = courseStudents.some(
      (s) => s.toString() === studentIdStr,
    );
    console.log(
      "[ENROLLMENT] Course students count:",
      courseStudents.length,
      "| Student ID:",
      studentIdStr,
      "| Enrolled:",
      isEnrolled,
    );

    if (isEnrolled) {
      // Find or create attendance record
      let attendanceRecord = await AttendanceRecord.findOne({
        student: student._id,
        lecture: activeLecture._id,
        date: getTodayDate(),
      });

      if (!attendanceRecord) {
        attendanceRecord = await AttendanceRecord.create({
          student: student._id,
          course: activeLecture.course._id,
          lecture: activeLecture._id,
          hall: hall._id,
          date: getTodayDate(),
          status: ATTENDANCE_STATUS.IN_PROGRESS,
          sessions: [{ checkIn: now }],
        });
        console.log(
          "[ATTENDANCE] ✅ Created NEW attendance record:",
          attendanceRecord._id,
        );
      } else if (attendanceRecord.status !== ATTENDANCE_STATUS.IN_PROGRESS) {
        // Re-open the record if student comes back
        attendanceRecord.status = ATTENDANCE_STATUS.IN_PROGRESS;
        attendanceRecord.sessions.push({ checkIn: now });
        await attendanceRecord.save();
        console.log(
          "[ATTENDANCE] ✅ Re-opened attendance record:",
          attendanceRecord._id,
        );
      } else {
        console.log(
          "[ATTENDANCE] Already has active attendance record:",
          attendanceRecord._id,
        );
      }

      // Link session to attendance record
      session.currentLecture = activeLecture._id;
      session.attendanceRecord = attendanceRecord._id;
      await session.save();

      connectionLog.student = student._id;
      connectionLog.processingResult = "Check-in recorded for lecture";
    } else {
      console.log(
        "[ENROLLMENT] ❌ Student NOT enrolled in course:",
        activeLecture.course?.name,
      );
      connectionLog.processingResult = "Student not enrolled in this course";
    }
  } else {
    console.log("[LECTURE] ❌ No active lecture in this hall right now");
    connectionLog.processingResult = "No active lecture in this hall";
  }

  connectionLog.processed = true;
  await connectionLog.save();
  console.log("--- [handleConnect] END ---\n");
}

/**
 * Handle student disconnect event
 */
async function handleDisconnect(student, hall, connectionLog) {
  const now = new Date();

  console.log("\n--- [handleDisconnect] START ---");
  console.log("Student:", student.studentId, "| Hall:", hall.name);

  // Find and update student session
  const session = await StudentSession.findOne({
    student: student._id,
    currentHall: hall._id,
    isActive: true,
  });

  if (session && session.attendanceRecord) {
    // Find attendance record and update last session
    const attendanceRecord = await AttendanceRecord.findById(
      session.attendanceRecord,
    );

    if (attendanceRecord && attendanceRecord.sessions.length > 0) {
      const lastSession =
        attendanceRecord.sessions[attendanceRecord.sessions.length - 1];

      if (!lastSession.checkOut) {
        lastSession.checkOut = now;

        // Calculate session duration
        const durationMinutes = calculateMinutes(
          lastSession.checkIn,
          lastSession.checkOut,
        );
        lastSession.duration = durationMinutes;

        // Update total presence time
        attendanceRecord.totalPresenceTime += durationMinutes;
      }

      // Mark attendance as "present" (student was here and left)
      if (attendanceRecord.status === ATTENDANCE_STATUS.IN_PROGRESS) {
        attendanceRecord.status = ATTENDANCE_STATUS.PRESENT;
        console.log("[ATTENDANCE] ✅ Status changed: in-progress → present");
      }

      await attendanceRecord.save();
    }

    // Deactivate session
    session.isActive = false;
    session.disconnectedAt = now;
    await session.save();

    connectionLog.student = student._id;
    connectionLog.processingResult = "Check-out recorded, marked as present";
    console.log("[DISCONNECT] Session closed, attendance marked as present");
  } else {
    connectionLog.processingResult = "No active session found";
    console.log("[DISCONNECT] No active session found");
  }

  connectionLog.processed = true;
  await connectionLog.save();
  console.log("--- [handleDisconnect] END ---\n");
}

/**
 * Get all connection logs
 * GET /api/connections
 */
exports.getConnectionLogs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 100,
    eventType,
    macAddress,
    hallId,
    startDate,
    endDate,
  } = req.query;

  const query = {};

  if (eventType) query.eventType = eventType;
  if (macAddress) query.macAddress = macAddress;
  if (hallId) query["accessPoint.hall"] = hallId;

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const total = await ConnectionLog.countDocuments(query);
  const logs = await ConnectionLog.find(query)
    .populate("student", "studentId name")
    .populate("accessPoint.hall", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(logs, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get connection logs for a specific hall
 * GET /api/connections/hall/:hallId
 */
exports.getHallConnectionLogs = catchAsync(async (req, res, next) => {
  const { hallId } = req.params;
  const { page = 1, limit = 50, date } = req.query;

  const query = { "accessPoint.hall": hallId };

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.timestamp = { $gte: startDate, $lte: endDate };
  }

  const total = await ConnectionLog.countDocuments(query);
  const logs = await ConnectionLog.find(query)
    .populate("student", "studentId name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(logs, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get unprocessed connection logs
 * GET /api/connections/unprocessed
 */
exports.getUnprocessedLogs = catchAsync(async (req, res, next) => {
  const logs = await ConnectionLog.find({ processed: false })
    .sort({ timestamp: 1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs,
  });
});

/**
 * Reprocess a connection log
 * POST /api/connections/:id/reprocess
 */
exports.reprocessLog = catchAsync(async (req, res, next) => {
  const log = await ConnectionLog.findById(req.params.id);

  if (!log) {
    return next(new ApiError("Connection log not found", 404));
  }

  // Find hall
  const hall = await Hall.findById(log.accessPoint.hall);
  if (!hall) {
    return next(new ApiError("Hall not found", 404));
  }

  // Find student
  const student = await User.findOne({
    role: ROLES.STUDENT,
    "device.macAddress": log.macAddress,
    "device.isVerified": true,
  });

  if (!student) {
    log.processed = true;
    log.processingResult = "Reprocess: Student not found";
    await log.save();
    return res.status(200).json({
      success: true,
      message: "Log reprocessed, but no student found",
    });
  }

  // Reprocess based on event type
  log.processed = false;
  log.processingResult = null;

  if (log.eventType === CONNECTION_EVENTS.CONNECTED) {
    await handleConnect(student, hall, log.macAddress, log);
  } else {
    await handleDisconnect(student, hall, log);
  }

  res.status(200).json({
    success: true,
    message: "Log reprocessed successfully",
    data: log,
  });
});

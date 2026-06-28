/**
 * Mobile Controller
 * Provides page-specific aggregated endpoints for the student mobile app.
 *
 * Each function corresponds to exactly one screen in the app:
 *   getHome          → Screen 2: Home (محاضرة حية + جدول اليوم + عداد)
 *   getSchedule      → Screen 3: الجدول الأسبوعي
 *   getAttendanceSummary → Screen 4: نسبة الحضور
 *   getAttendanceHistory → Screen 5: سجل الحضور
 *   getProfile       → Screen 6: الملف الشخصي
 *   requestDeviceChange  → Screen 7 / More: طلب تغيير الجهاز
 */

const {
  AttendanceRecord,
  StudentSession,
  Lecture,
  Course,
  User,
} = require("../models");

const { catchAsync } = require("../utils/helpers");
const { ATTENDANCE_STATUS, DEVICE_REQUEST_STATUS } = require("../config/constants");
const ApiError = require("../utils/ApiError");

// Helper to get local date string (YYYY-MM-DD) avoiding UTC timezone shifts
function getLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─────────────────────────────────────────────
// Arabic helpers
// ─────────────────────────────────────────────

/** Egyptian academic week: Saturday(6) → Thursday(4) (Friday excluded as holiday) */
const DAY_ORDER = [6, 0, 1, 2, 3, 4];

const DAY_NAMES_AR = {
  0: "الأحد",
  1: "الإثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/** Format a Date as Arabic string: "21 أبريل 2025" */
const formatDateAr = (date) => {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
};

const STATUS_AR = {
  present: "حضور",
  absent: "غياب",
  late: "متأخر",
  excused: "مقبول",
  "in-progress": "جارية",
};

const STATUS_LEVEL = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
  "in-progress": "info",
};

/** Convert minutes count to "HH:MM:SS" */
const minutesToHMS = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

/** Parse "HH:MM" → minutes since midnight */
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Get current time in minutes since midnight */
const nowMinutes = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

/** Convert "HH:MM" to today's Date ISO string */
const getIsoTimeToday = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  return d.toISOString();
};

/** Compute alert level for attendance percentage */
const buildAttendanceAlert = (percentage) => {
  if (percentage >= 80) {
    return { shouldAlert: false, message: null, level: "safe" };
  }
  if (percentage >= 75) {
    return {
      shouldAlert: true,
      message: `أنت قريب من نسبة الغياب المسموح بها (75%). نسبة حضورك الآن ${percentage}%`,
      level: "warning",
    };
  }
  return {
    shouldAlert: true,
    message: `تجاوزت نسبة الغياب المسموح بها (75%). نسبة حضورك الآن ${percentage}%`,
    level: "danger",
  };
};

// ─────────────────────────────────────────────
// Screen 2 – Home
// GET /api/mobile/home
// ─────────────────────────────────────────────
exports.getHome = catchAsync(async (req, res) => {
  const student = req.user;
  const today = new Date().getDay(); // 0=Sun … 6=Sat
  const currentMins = nowMinutes();

  // 1. Load all lectures for enrolled courses on today's weekday
  const enrolledIds = student.academicInfo?.enrolledCourses || [];

  const todayLectures = await Lecture.find({
    course: { $in: enrolledIds },
    dayOfWeek: today,
    isActive: true,
  })
    .populate("course", "name code")
    .populate("hall", "name")
    .populate("doctor", "name")
    .sort({ startTime: 1 });

  // 2. Identify live lecture (ongoing right now)
  let liveLecture = null;
  let nextLecture = null;

  // Check if student is actually inside a hall session
  const activeSession = await StudentSession.findActiveSession(student._id);

  if (activeSession && activeSession.currentLecture) {
    const liveLec = await Lecture.findById(activeSession.currentLecture)
      .populate("course", "name code")
      .populate("hall", "name")
      .populate("doctor", "name");

    if (liveLec) {
      // Calculate remaining time in seconds
      const endMins = toMinutes(liveLec.endTime);
      const remainingSecs = Math.max(0, (endMins - currentMins) * 60);

      // Get attendance status and check-in time
      let attendanceStatus = ATTENDANCE_STATUS.IN_PROGRESS;
      let checkInTime = activeSession.connectedAt || activeSession.createdAt;

      if (activeSession.attendanceRecord) {
        const rec = await AttendanceRecord.findById(activeSession.attendanceRecord);
        if (rec) {
          attendanceStatus = rec.status;
          if (rec.sessions && rec.sessions.length > 0) {
            checkInTime = rec.sessions[0].checkIn;
          }
        }
      }

      liveLecture = {
        lectureId: liveLec._id,
        courseName: liveLec.course?.name || "",
        courseCode: liveLec.course?.code || "",
        doctorName: liveLec.doctor
          ? `د. ${liveLec.doctor.name?.first || ""} ${liveLec.doctor.name?.last || ""}`.trim()
          : "",
        hallName: liveLec.hall?.name || "",
        startTime: liveLec.startTime,
        endTime: liveLec.endTime,
        startTimeIso: getIsoTimeToday(liveLec.startTime),
        endTimeIso: getIsoTimeToday(liveLec.endTime),
        durationMinutes: liveLec.durationMinutes || Math.round((toMinutes(liveLec.endTime) - toMinutes(liveLec.startTime))),
        remainingTime: minutesToHMS(remainingSecs),
        attendanceStatus,
        attendanceStatusAr: STATUS_AR[attendanceStatus] || attendanceStatus,
        checkInTime: checkInTime ? new Date(checkInTime).toISOString() : null,
      };
    }
  }

  // 3. Determine next upcoming lecture (not live)
  const liveLectureId = liveLecture?.lectureId?.toString();
  for (const lec of todayLectures) {
    if (lec._id.toString() === liveLectureId) continue;
    const startMins = toMinutes(lec.startTime);
    if (startMins > currentMins) {
      const countdownSecs = (startMins - currentMins) * 60;
      nextLecture = {
        lectureId: lec._id,
        courseName: lec.course?.name || "",
        courseCode: lec.course?.code || "",
        doctorName: lec.doctor
          ? `د. ${lec.doctor.name?.first || ""} ${lec.doctor.name?.last || ""}`.trim()
          : "",
        hallName: lec.hall?.name || "",
        startTime: lec.startTime,
        endTime: lec.endTime,
        countdownFormatted: minutesToHMS(countdownSecs),
      };
      break;
    }
  }

  // 4. Build today's schedule list (formatted for UI)
  const todaySchedule = todayLectures.map((lec) => ({
    lectureId: lec._id,
    courseName: lec.course?.name || "",
    courseCode: lec.course?.code || "",
    doctorName: lec.doctor
      ? `د. ${lec.doctor.name?.first || ""} ${lec.doctor.name?.last || ""}`.trim()
      : "",
    hallName: lec.hall?.name || "",
    startTime: lec.startTime,
    endTime: lec.endTime,
    lectureType: lec.lectureType,
    isLive: lec._id.toString() === liveLectureId,
  }));

  res.status(200).json({
    success: true,
    data: {
      // Welcome header
      studentName: student.name?.first || "",
      todayLecturesCount: todayLectures.length,
      todayDateFormatted: formatDateAr(new Date()),
      dayNameAr: DAY_NAMES_AR[today],

      // Live lecture banner (null if not in any lecture)
      liveLecture,

      // Today's schedule
      todaySchedule,

      // Next lecture countdown (null if no upcoming lecture)
      nextLecture,
    },
  });
});

// ─────────────────────────────────────────────
// Screen 3 – Weekly Schedule
// GET /api/mobile/schedule
// ─────────────────────────────────────────────
exports.getSchedule = catchAsync(async (req, res) => {
  const student = req.user;
  const enrolledIds = student.academicInfo?.enrolledCourses || [];

  // Fetch all lectures for enrolled courses
  const allLectures = await Lecture.find({
    course: { $in: enrolledIds },
    isActive: true,
  })
    .populate("course", "name code")
    .populate("hall", "name")
    .populate("doctor", "name")
    .sort({ startTime: 1 });

  // Group by dayOfWeek
  const grouped = {};
  for (const d of DAY_ORDER) grouped[d] = [];

  for (const lec of allLectures) {
    if (grouped[lec.dayOfWeek] !== undefined) {
      grouped[lec.dayOfWeek].push({
        lectureId: lec._id,
        courseName: lec.course?.name || "",
        courseCode: lec.course?.code || "",
        doctorName: lec.doctor
          ? `د. ${lec.doctor.name?.first || ""} ${lec.doctor.name?.last || ""}`.trim()
          : "",
        hallName: lec.hall?.name || "",
        startTime: lec.startTime,
        endTime: lec.endTime,
        lectureType: lec.lectureType,
      });
    }
  }

  // Calculate the actual calendar date for each weekday in the current week
  // (anchor = today, find the Saturday of this week then walk forward)
  const now = new Date();
  const todayDow = now.getDay(); // 0-6
  // Distance from today back to Saturday (6)
  const diffToSat = (todayDow - 6 + 7) % 7;
  const saturdayDate = new Date(now);
  saturdayDate.setDate(now.getDate() - diffToSat);
  saturdayDate.setHours(0, 0, 0, 0);

  // Build response days in Egyptian academic week order
  const days = DAY_ORDER.map((dow) => {
    // Offset from Saturday: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5
    const satOffset = (dow - 6 + 7) % 7;
    const date = new Date(saturdayDate);
    date.setDate(saturdayDate.getDate() + satOffset);

    return {
      dayOfWeek: dow,
      dayNameAr: DAY_NAMES_AR[dow],
      date: getLocalDateString(date),
      dateFormatted: formatDateAr(date),
      isToday: dow === todayDow,
      lectures: grouped[dow],
    };
  });

  res.status(200).json({
    success: true,
    data: { days },
  });
});

// ─────────────────────────────────────────────
// Screen 4 – Attendance Summary (circular progress)
// GET /api/mobile/attendance/summary?courseId=<id>
// ─────────────────────────────────────────────
exports.getAttendanceSummary = catchAsync(async (req, res) => {
  const student = req.user;
  const enrolledCourses = await Course.find({
    _id: { $in: student.academicInfo?.enrolledCourses || [] },
  }).select("name code");

  if (!enrolledCourses.length) {
    return res.status(200).json({
      success: true,
      data: {
        courses: [],
        selected: null,
      },
    });
  }

  // Determine selected course (query param or first enrolled)
  let selectedCourseId = req.query.courseId;
  if (
    !selectedCourseId ||
    !enrolledCourses.find((c) => c._id.toString() === selectedCourseId)
  ) {
    selectedCourseId = enrolledCourses[0]._id.toString();
  }

  const selectedCourse = enrolledCourses.find(
    (c) => c._id.toString() === selectedCourseId,
  );

  // Count finalized records for this student + course
  const records = await AttendanceRecord.find({
    student: student._id,
    course: selectedCourseId,
    isFinalized: true,
  }).select("status");

  const totalLectures = records.length;
  const attendedCount = records.filter(
    (r) => r.status === ATTENDANCE_STATUS.PRESENT || r.status === "late",
  ).length;
  const absentCount = records.filter(
    (r) => r.status === ATTENDANCE_STATUS.ABSENT,
  ).length;
  const attendancePercentage =
    totalLectures > 0 ? Math.round((attendedCount / totalLectures) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      // Dropdown options
      courses: enrolledCourses.map((c) => ({
        courseId: c._id,
        courseCode: c.code,
        courseName: c.name,
      })),
      // Selected course stats
      selected: {
        courseId: selectedCourse._id,
        courseCode: selectedCourse.code,
        courseName: selectedCourse.name,
        totalLectures,
        attendedCount,
        absentCount,
        attendancePercentage,
        alert: buildAttendanceAlert(attendancePercentage),
      },
    },
  });
});

// ─────────────────────────────────────────────
// Screen 5 – Attendance History (log list)
// GET /api/mobile/attendance/history?courseId=<id>&page=1&limit=20
// ─────────────────────────────────────────────
exports.getAttendanceHistory = catchAsync(async (req, res) => {
  const student = req.user;
  const { courseId, page = 1, limit = 20 } = req.query;

  const enrolledCourses = await Course.find({
    _id: { $in: student.academicInfo?.enrolledCourses || [] },
  }).select("name code");

  // Build query
  const query = { student: student._id, isFinalized: true };
  if (courseId && courseId !== "all") {
    query.course = courseId;
  }

  const total = await AttendanceRecord.countDocuments(query);
  const records = await AttendanceRecord.find(query)
    .populate("course", "name code")
    .populate("lecture", "startTime endTime dayOfWeek")
    .populate({ path: "lecture", populate: { path: "doctor", select: "name" } })
    .sort({ date: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  // Re-populate doctor via lecture
  const populatedRecords = await AttendanceRecord.find(query)
    .populate("course", "name code")
    .populate({
      path: "lecture",
      select: "startTime endTime dayOfWeek doctor",
      populate: { path: "doctor", select: "name" },
    })
    .sort({ date: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const logs = populatedRecords.map((rec) => {
    const doctor = rec.lecture?.doctor;
    const doctorName = doctor
      ? `د. ${doctor.name?.first || ""} ${doctor.name?.last || ""}`.trim()
      : "";

    return {
      recordId: rec._id,
      dateFormatted: formatDateAr(rec.date),
      date: rec.date,
      courseCode: rec.course?.code || "",
      courseName: rec.course?.name || "",
      doctorName,
      status: rec.status,
      statusArabic: STATUS_AR[rec.status] || rec.status,
      statusLevel: STATUS_LEVEL[rec.status] || "info",
    };
  });

  // Dropdown options (كل المواد + individual courses)
  const courseOptions = [
    { courseId: "all", courseCode: null, courseName: "كل المواد" },
    ...enrolledCourses.map((c) => ({
      courseId: c._id,
      courseCode: c.code,
      courseName: c.name,
    })),
  ];

  res.status(200).json({
    success: true,
    data: {
      courses: courseOptions,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
    },
  });
});

// ─────────────────────────────────────────────
// Screen 6 – Profile
// GET /api/mobile/profile
// ─────────────────────────────────────────────
exports.getProfile = catchAsync(async (req, res) => {
  // Re-fetch with specialization populated
  const student = await User.findById(req.user._id)
    .populate("academicInfo.specialization", "name")
    .populate("academicInfo.enrolledCourses", "name code")
    .select("-password");

  if (!student) throw ApiError.notFound("Student not found");

  // Device info
  const device = student.device || {};
  const hasDevice = !!(device.macAddress);
  const isVerified = device.isVerified === true;

  let deviceStatusText = "غير مسجل";
  let deviceStatusLevel = "danger";

  if (hasDevice && isVerified) {
    deviceStatusText = "معتمد";
    deviceStatusLevel = "success";
  } else if (hasDevice && !isVerified) {
    deviceStatusText = "قيد الاعتماد";
    deviceStatusLevel = "warning";
  }

  // Device change request info
  const dcr = student.deviceChangeRequest;
  let deviceChangeRequest = null;
  if (dcr?.requested) {
    deviceChangeRequest = {
      status: dcr.status,
      requestedAt: dcr.requestedAt,
      reason: dcr.reason,
      newMacAddress: dcr.newDeviceInfo?.macAddress || null,
    };
  }

  res.status(200).json({
    success: true,
    data: {
      // Identity
      name: `${student.name?.first || ""} ${student.name?.last || ""}`.trim(),
      firstName: student.name?.first || "",
      studentId: student.studentId || "",
      email: student.email || "",
      phone: student.phone || "",

      // Academic
      specialization: student.academicInfo?.specialization?.name || "",
      level: student.academicInfo?.level || null,

      // Enrolled courses (for reference)
      enrolledCourses: (student.academicInfo?.enrolledCourses || []).map((c) => ({
        courseId: c._id,
        courseCode: c.code,
        courseName: c.name,
      })),

      // Device binding
      device: {
        isRegistered: hasDevice,
        isVerified,
        macAddress: device.macAddress || null,
        registeredAt: device.registeredAt || null,
        statusText: deviceStatusText,
        statusLevel: deviceStatusLevel,
      },

      // Pending device change request (null if none)
      deviceChangeRequest,
    },
  });
});

// ─────────────────────────────────────────────
// Screen 7 / More – Request Device Change
// POST /api/mobile/device-change-request
// ─────────────────────────────────────────────
exports.requestDeviceChange = catchAsync(async (req, res) => {
  const { reason, newDeviceInfo } = req.body;

  if (!reason || reason.trim().length < 5) {
    throw ApiError.badRequest("يجب إدخال سبب لطلب تغيير الجهاز (5 أحرف على الأقل)");
  }

  if (!newDeviceInfo || !newDeviceInfo.macAddress) {
    throw ApiError.badRequest("يجب إدخال معلومات الجهاز الجديد (MAC Address مطلوب)");
  }

  const user = await User.findById(req.user._id);

  if (
    user.deviceChangeRequest?.requested &&
    user.deviceChangeRequest.status === DEVICE_REQUEST_STATUS.PENDING
  ) {
    throw ApiError.badRequest("لديك طلب تغيير جهاز قيد المراجعة بالفعل");
  }

  user.deviceChangeRequest = {
    requested: true,
    requestedAt: new Date(),
    reason: reason.trim(),
    newDeviceInfo,
    status: DEVICE_REQUEST_STATUS.PENDING,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "تم إرسال طلب تغيير الجهاز بنجاح، سيتم مراجعته من قِبَل الإدارة",
  });
});

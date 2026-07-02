const { User, AttendanceRecord, Course, Specialization } = require("../models");
const { ROLES, DEVICE_REQUEST_STATUS } = require("../config/constants");
const ApiError = require("../utils/ApiError");
const { catchAsync, paginationResponse, buildNameSearchQuery, normalizeMacAddress } = require("../utils/helpers");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");

/**
 * Get student statistics
 * GET /api/students/stats
 */
exports.getStudentStats = catchAsync(async (req, res, next) => {
  const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });

  const levelStats = await User.aggregate([
    { $match: { role: ROLES.STUDENT } },
    {
      $group: {
        _id: "$academicInfo.level",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Format level stats into a simple object
  const levelCounts = {};
  // Initialize with 0 for levels 1-4
  [1, 2, 3, 4].forEach((l) => (levelCounts[l] = 0));
  levelStats.forEach((stat) => {
    if (stat._id) levelCounts[stat._id] = stat.count;
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalStudents,
      levels: levelCounts,
    },
  });
});

/**
 * Get all students
 * GET /api/students
 */
exports.getAllStudents = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, specialization, level, search } = req.query;

  const query = { role: ROLES.STUDENT };

  if (specialization) {
    query["academicInfo.specialization"] = specialization;
  }

  if (level) {
    query["academicInfo.level"] = parseInt(level);
  }

  if (search) {
    Object.assign(query, buildNameSearchQuery(search, ["studentId"]));
  }

  const total = await User.countDocuments(query);
  const students = await User.find(query)
    .populate("academicInfo.specialization")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ studentId: 1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(students, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get single student
 * GET /api/students/:id
 */
exports.getStudent = catchAsync(async (req, res, next) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: ROLES.STUDENT,
  })
    .populate("academicInfo.specialization")
    .populate("academicInfo.enrolledCourses");

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  res.status(200).json({
    success: true,
    data: student,
  });
});

/**
 * Create student
 * POST /api/students
 */
exports.createStudent = catchAsync(async (req, res, next) => {
  const studentData = {
    ...req.body,
    role: ROLES.STUDENT,
  };

  const student = await User.create(studentData);

  res.status(201).json({
    success: true,
    data: student,
  });
});

/**
 * Create students in bulk
 * POST /api/students/bulk
 */
exports.createStudentsBulk = catchAsync(async (req, res, next) => {
  const { students, defaultPassword = "123456" } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest("Students array is required");
  }

  const results = {
    success: [],
    failed: [],
  };

  for (const studentData of students) {
    try {
      const student = await User.create({
        ...studentData,
        password: studentData.password || defaultPassword,
        role: ROLES.STUDENT,
      });
      results.success.push({
        studentId: student.studentId,
        name: student.fullName,
      });
    } catch (error) {
      results.failed.push({
        studentId: studentData.studentId,
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    data: results,
  });
});

/**
 * Update student
 * PUT /api/students/:id
 */
exports.updateStudent = catchAsync(async (req, res, next) => {
  // Don't allow certain fields to be updated
  delete req.body.role;

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.STUDENT },
    req.body,
    { new: true, runValidators: true },
  );

  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  res.status(200).json({
    success: true,
    data: student,
  });
});

/**
 * Get student attendance
 * GET /api/students/:id/attendance
 */
exports.getStudentAttendance = catchAsync(async (req, res, next) => {
  const { courseId, startDate, endDate, page = 1, limit = 20 } = req.query;

  const query = { student: req.params.id };

  if (courseId) {
    query.course = courseId;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const total = await AttendanceRecord.countDocuments(query);
  const records = await AttendanceRecord.find(query)
    .populate("course", "name code")
    .populate("lecture", "startTime endTime dayOfWeek")
    .populate("hall", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(records, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Get student attendance summary
 * GET /api/students/:id/attendance-summary
 */
exports.getStudentAttendanceSummary = catchAsync(async (req, res, next) => {
  const studentId = req.params.id;

  const student = await User.findById(studentId);
  if (!student) {
    throw ApiError.notFound("Student not found");
  }

  // Get enrolled courses
  const courses = await Course.find({
    students: studentId,
  }).populate("doctor", "name");

  const summary = [];

  for (const course of courses) {
    const totalRecords = await AttendanceRecord.countDocuments({
      student: studentId,
      course: course._id,
      isFinalized: true,
    });

    const presentRecords = await AttendanceRecord.countDocuments({
      student: studentId,
      course: course._id,
      isFinalized: true,
      status: "present",
    });

    summary.push({
      course: {
        id: course._id,
        name: course.name,
        code: course.code,
        doctor: course.doctor
          ? typeof course.doctor.name === "object"
            ? `${course.doctor.name.first} ${course.doctor.name.last}`
            : course.doctor.name || course.doctor.fullName
          : undefined,
      },
      totalLectures: totalRecords,
      attendedLectures: presentRecords,
      attendancePercentage:
        totalRecords > 0
          ? Math.round((presentRecords / totalRecords) * 100)
          : 0,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      student: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
      },
      summary,
    },
  });
});

/**
 * Get my device info
 * GET /api/students/my-device
 */
exports.getMyDevice = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      device: user.device,
      hasDeviceChangeRequest: user.deviceChangeRequest?.requested,
      deviceChangeRequest: user.deviceChangeRequest,
    },
  });
});

/**
 * Request device change
 * POST /api/students/request-device-change
 */
exports.requestDeviceChange = catchAsync(async (req, res, next) => {
  const { reason, newDeviceInfo } = req.body;

  if (!reason) {
    throw ApiError.badRequest("Reason is required");
  }

  if (!newDeviceInfo || !newDeviceInfo.macAddress) {
    throw ApiError.badRequest("New device info is required");
  }

  const user = await User.findById(req.user._id);

  if (
    user.deviceChangeRequest?.requested &&
    user.deviceChangeRequest.status === DEVICE_REQUEST_STATUS.PENDING
  ) {
    throw ApiError.badRequest(
      "You already have a pending device change request",
    );
  }

  user.deviceChangeRequest = {
    requested: true,
    requestedAt: new Date(),
    reason,
    newDeviceInfo,
    status: DEVICE_REQUEST_STATUS.PENDING,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change request submitted successfully",
  });
});

/**
 * Get device change requests
 * GET /api/students/device-requests
 */
exports.getDeviceChangeRequests = catchAsync(async (req, res, next) => {
  const {
    status = DEVICE_REQUEST_STATUS.PENDING,
    page = 1,
    limit = 10,
  } = req.query;

  const query = {
    role: ROLES.STUDENT,
    "deviceChangeRequest.requested": true,
  };

  if (status) {
    query["deviceChangeRequest.status"] = status;
  }

  const total = await User.countDocuments(query);
  const requests = await User.find(query)
    .select("studentId name email device deviceChangeRequest")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ "deviceChangeRequest.requestedAt": -1 });

  res.status(200).json({
    success: true,
    ...paginationResponse(requests, total, parseInt(page), parseInt(limit)),
  });
});

/**
 * Approve device change
 * POST /api/students/device-requests/:id/approve
 */
exports.approveDeviceChange = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (!user.deviceChangeRequest?.requested) {
    throw ApiError.badRequest("No device change request found");
  }

  // Update device with new info — normalize MAC to ensure consistent uppercase storage
  const newDeviceInfo = user.deviceChangeRequest.newDeviceInfo || {};
  user.device = {
    ...newDeviceInfo,
    macAddress: normalizeMacAddress(newDeviceInfo.macAddress) || newDeviceInfo.macAddress,
    registeredAt: new Date(),
    isVerified: true,
  };

  user.deviceChangeRequest = {
    requested: false,
    status: DEVICE_REQUEST_STATUS.APPROVED,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change approved successfully",
  });
});

/**
 * Reject device change
 * POST /api/students/device-requests/:id/reject
 */
exports.rejectDeviceChange = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (!user.deviceChangeRequest?.requested) {
    throw ApiError.badRequest("No device change request found");
  }

  user.deviceChangeRequest = {
    requested: false,
    status: DEVICE_REQUEST_STATUS.REJECTED,
    reason: reason || "Request rejected by admin",
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change rejected",
  });
});

/**
 * Get promotion preview — عرض الطلاب في فرقة معينة قبل الترقية
 * GET /api/students/promotion-preview?specialization=xxx&level=1
 */
exports.getPromotionPreview = catchAsync(async (req, res, next) => {
  const { specialization, level } = req.query;

  if (!level) {
    throw ApiError.badRequest("Level is required");
  }

  const currentLevel = parseInt(level);

  const query = { role: ROLES.STUDENT, "academicInfo.level": currentLevel, isActive: true };
  if (specialization) {
    query["academicInfo.specialization"] = specialization;
  }

  const students = await User.find(query)
    .populate("academicInfo.specialization", "name code levels")
    .select("studentId name email academicInfo isActive")
    .sort({ studentId: 1 })
    .lean();

  // Determine next level per student based on their specialization levels
  const enriched = students.map((s) => {
    const spec = s.academicInfo?.specialization;
    const specLevels = spec?.levels || [];
    const maxLevel = specLevels.length > 0
      ? Math.max(...specLevels.map((l) => l.level))
      : 5; // default max

    const isLastLevel = currentLevel >= maxLevel;
    const nextLevel = isLastLevel ? null : currentLevel + 1;

    const nextLevelName = !isLastLevel && specLevels.length > 0
      ? specLevels.find((l) => l.level === nextLevel)?.name || `الفرقة ${nextLevel}`
      : null;

    return {
      _id: s._id,
      studentId: s.studentId,
      name: s.name,
      email: s.email,
      currentLevel,
      nextLevel,
      nextLevelName,
      willGraduate: isLastLevel,
      specialization: spec
        ? { _id: spec._id, name: spec.name, code: spec.code }
        : null,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      students: enriched,
      summary: {
        total: enriched.length,
        willPromote: enriched.filter((s) => !s.willGraduate).length,
        willGraduate: enriched.filter((s) => s.willGraduate).length,
        currentLevel,
      },
    },
  });
});

/**
 * Promote students — ترقية الطلاب المحددين للفرقة التالية
 * POST /api/students/promote
 * Body: { studentIds: [...], clearEnrolledCourses: true }
 *
 * الطلاب اللي مش في القائمة = يعيدوا السنة = لا يُمس حسابهم
 */
exports.promoteStudents = catchAsync(async (req, res, next) => {
  const { studentIds, clearEnrolledCourses = false } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest("studentIds array is required and must not be empty");
  }

  // Fetch all selected students
  const students = await User.find({
    _id: { $in: studentIds },
    role: ROLES.STUDENT,
    isActive: true,
  }).populate("academicInfo.specialization", "levels");

  if (students.length === 0) {
    throw ApiError.notFound("No active students found with the provided IDs");
  }

  const results = {
    promoted: [],
    graduated: [],
    failed: [],
  };

  for (const student of students) {
    try {
      const spec = student.academicInfo?.specialization;
      const specLevels = spec?.levels || [];
      const currentLevel = student.academicInfo?.level;

      const maxLevel = specLevels.length > 0
        ? Math.max(...specLevels.map((l) => l.level))
        : 5;

      if (currentLevel >= maxLevel) {
        // Last level → graduate
        student.isActive = false;
        if (clearEnrolledCourses) {
          student.academicInfo.enrolledCourses = [];
        }
        await student.save();
        results.graduated.push({
          _id: student._id,
          studentId: student.studentId,
          name: student.name,
          level: currentLevel,
        });
      } else {
        // Normal promotion
        const newLevel = currentLevel + 1;
        student.academicInfo.level = newLevel;
        if (clearEnrolledCourses) {
          student.academicInfo.enrolledCourses = [];
        }
        await student.save();
        results.promoted.push({
          _id: student._id,
          studentId: student.studentId,
          name: student.name,
          fromLevel: currentLevel,
          toLevel: newLevel,
        });
      }
    } catch (err) {
      results.failed.push({
        _id: student._id,
        studentId: student.studentId,
        error: err.message,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: `تمت الترقية: ${results.promoted.length} طالب، تخرج: ${results.graduated.length} طالب`,
    data: results,
  });
});

/**
 * Import students via Excel
 * POST /api/students/import-excel
 */
exports.importStudentsExcel = catchAsync(async (req, res, next) => {
  const file = req.file;
  if (!file) {
    throw ApiError.badRequest("الرجاء رفع ملف الإكسيل");
  }

  const workbook = xlsx.read(file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (data.length === 0) {
    throw ApiError.badRequest("الملف فارغ أو لا يحتوي على بيانات صحيحة");
  }

  // 1. Check for duplicates INSIDE the Excel file itself
  const uniqueStudentIds = new Set();
  const uniqueEmails = new Set();
  const fileDuplicates = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;
    const sId = row.studentId?.toString().trim();
    const email = row.email?.toString().trim().toLowerCase();

    if (sId) {
      if (uniqueStudentIds.has(sId)) {
        fileDuplicates.push(`كود طالب مكرر بداخل الملف (${sId}) في الصف ${rowNum}`);
      } else {
        uniqueStudentIds.add(sId);
      }
    }
    if (email) {
      if (uniqueEmails.has(email)) {
        fileDuplicates.push(`بريد إلكتروني مكرر بداخل الملف (${email}) في الصف ${rowNum}`);
      } else {
        uniqueEmails.add(email);
      }
    }
  }

  if (fileDuplicates.length > 0) {
    return res.status(400).json({
      success: false,
      message: "الملف يحتوي على بيانات مكررة بداخله، يرجى مراجعتها وتعديلها",
      errors: fileDuplicates,
    });
  }

  // Fetch all specializations to avoid querying inside the loop
  const allSpecializations = await Specialization.find();
  const specMap = {};
  allSpecializations.forEach((spec) => {
    specMap[spec.name.trim()] = spec;
  });

  const excelStudentIds = Array.from(uniqueStudentIds);
  const excelEmails = Array.from(uniqueEmails);

  // 2. Check for duplicates in the DATABASE
  const existingStudents = await User.find({
    role: ROLES.STUDENT,
    $or: [
      { studentId: { $in: excelStudentIds } },
      { email: { $in: excelEmails } },
    ],
  });

  if (existingStudents.length > 0) {
    const duplicatedIds = existingStudents.map((s) => s.studentId || s.email).join(", ");
    throw ApiError.badRequest(
      `تم إيقاف الرفع! هؤلاء الطلاب مضافون بالفعل في النظام: ${duplicatedIds}`
    );
  }

  // Level mapper
  const levelMapper = {
    "اعدادي": 1, "إعدادي": 1, "اعدادية": 1, "الإعدادية": 1, "1": 1,
    "الاولى": 2, "الأولى": 2, "اولى": 2, "أولى": 2, "2": 2,
    "الثانية": 3, "ثانية": 3, "3": 3,
    "الثالثة": 4, "ثالثة": 4, "4": 4,
    "الرابعة": 5, "رابعة": 5, "5": 5,
  };

  const studentsToPrepare = [];
  const errors = [];

  // 3. Validation Phase (No CPU-intensive hashing here)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // Excel row number

    // Required basic info validation
    const studentId = row.studentId?.toString().trim();
    const firstName = row.firstName?.toString().trim();
    const lastName = row.lastName?.toString().trim();
    const email = row.email?.toString().trim().toLowerCase();

    if (!studentId || !firstName || !lastName || !email) {
      errors.push(`خطأ في الصف ${rowNum}: بيانات أساسية مفقودة أو فارغة (الكود، الاسم، أو الإيميل)`);
      continue;
    }

    // Parse Level
    const levelText = row.level?.toString().trim();
    let levelNum = parseInt(levelText);

    if (isNaN(levelNum)) {
      levelNum = levelMapper[levelText];
    }

    if (!levelNum || levelNum < 1 || levelNum > 7) {
      errors.push(`خطأ في الصف ${rowNum}: الفرقة غير صحيحة أو مفقودة (${levelText || "فارغ"})`);
      continue;
    }

    let specId = null;
    let department = null;

    // Handle Specialization
    const specName = row.specialization?.toString().trim();

    if (specName) {
      if (specMap[specName]) {
        specId = specMap[specName]._id;

        // Handle Department
        if (row.department) {
          const deptName = row.department.toString().trim();
          if (specMap[specName].departments.includes(deptName)) {
            department = deptName;
          } else {
            errors.push(
              `خطأ في الصف ${rowNum}: القسم (${deptName}) غير موجود بداخل تخصص (${specName})`
            );
          }
        }
      } else {
        errors.push(
          `خطأ في الصف ${rowNum}: التخصص (${specName}) غير موجود في النظام`
        );
      }
    }

    studentsToPrepare.push({
      studentId,
      email,
      name: {
        first: firstName,
        last: lastName,
      },
      role: ROLES.STUDENT,
      academicInfo: {
        level: levelNum,
        specialization: specId,
        department: department,
      },
    });
  }

  // Return validation errors immediately
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "يوجد أخطاء في البيانات تمنع الرفع، يرجى إصلاحها أولاً",
      errors,
    });
  }

  // 4. Processing Phase: Hash the default password ONCE for all students (Huge CPU saving!)
  const defaultPassword = req.body.defaultPassword || "123456";
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  const studentsToInsert = studentsToPrepare.map((student) => ({
    ...student,
    password: hashedPassword,
  }));

  // 5. Database Insertion
  await User.insertMany(studentsToInsert);

  res.status(200).json({
    success: true,
    message: `تم رفع وإضافة عدد ${studentsToInsert.length} طالب بنجاح بكلمة مرور افتراضية موحدة`,
  });
});

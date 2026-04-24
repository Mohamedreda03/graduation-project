const OpenAI = require("openai");
const config = require("../config/env");
const {
  User,
  Course,
  AttendanceRecord,
  Department,
  Lecture,
} = require("../models");
const { ROLES, ATTENDANCE_STATUS } = require("../config/constants");

// Initialize OpenAI client for OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: config.openRouterApiKey,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5173", // Optional, for OpenRouter ranking
    "X-Title": "WiFi Attendance System", // Optional
  }
});

/**
 * Real-world Tools implementation with strict permission filtering
 */
const toolImplementations = {
  get_system_statistics: async ({ user }) => {
    try {
      if (user.role === ROLES.ADMIN) {
        const students = await User.countDocuments({ role: ROLES.STUDENT });
        const doctors = await User.countDocuments({ role: ROLES.DOCTOR });
        const courses = await Course.countDocuments({ isActive: true });
        return JSON.stringify({ students, doctors, courses, role: "Admin" });
      } 
      
      if (user.role === ROLES.DOCTOR) {
        const courses = await Course.find({ doctor: user._id, isActive: true });
        const courseIds = courses.map(c => c._id);
        const studentCount = await User.countDocuments({ 
          role: ROLES.STUDENT, 
          "academicInfo.enrolledCourses": { $in: courseIds } 
        });
        return JSON.stringify({ 
          myCourses: courses.length, 
          myStudents: studentCount,
          role: "Doctor" 
        });
      }

      if (user.role === ROLES.STUDENT) {
        const attendance = await AttendanceRecord.countDocuments({ student: user._id });
        const present = await AttendanceRecord.countDocuments({ 
          student: user._id, 
          status: ATTENDANCE_STATUS.PRESENT 
        });
        return JSON.stringify({ 
          totalLectures: attendance, 
          attended: present,
          percentage: attendance > 0 ? (present / attendance * 100).toFixed(1) + "%" : "0%",
          role: "Student" 
        });
      }

      return JSON.stringify({ error: "Unauthorized" });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },

  list_all_courses: async ({ user }) => {
    try {
      let query = { isActive: true };
      
      if (user.role === ROLES.DOCTOR) {
        query.doctor = user._id;
      } else if (user.role === ROLES.STUDENT) {
        query._id = { $in: user.academicInfo.enrolledCourses || [] };
      }

      const courses = await Course.find(query)
        .populate("doctor", "name")
        .select("name code doctor level")
        .limit(20)
        .lean();
      return JSON.stringify(courses);
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },

  search_users: async ({ role, level, name, user }) => {
    try {
      if (user.role === ROLES.STUDENT) {
        return JSON.stringify({ error: "ليس لديك صلاحية للبحث عن مستخدمين." });
      }

      let query = {};
      if (role) query.role = role.toLowerCase();
      if (level) {
        const numericLevel = parseInt(level);
        if (!isNaN(numericLevel)) query["academicInfo.level"] = numericLevel;
      }
      if (name) {
        query["$or"] = [
          { "name.first": new RegExp(name, "i") },
          { "name.last": new RegExp(name, "i") }
        ];
      }

      if (user.role === ROLES.DOCTOR) {
        const myCourses = await Course.find({ doctor: user._id }).select("_id");
        const myCourseIds = myCourses.map(c => c._id);
        query.role = ROLES.STUDENT;
        query["academicInfo.enrolledCourses"] = { $in: myCourseIds };
      }

      const users = await User.find(query)
        .limit(10)
        .select("name studentId role academicInfo.level email")
        .lean();
      return JSON.stringify(users);
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },

  get_course_students: async ({ courseId, user }) => {
    try {
      const course = await Course.findById(courseId);
      if (!course) return JSON.stringify({ error: "الكورس غير موجود" });

      if (user.role === ROLES.DOCTOR && course.doctor.toString() !== user._id.toString()) {
        return JSON.stringify({ error: "لا يمكنك الوصول لبيانات طلاب كورس لا تدرسه." });
      }
      if (user.role === ROLES.STUDENT) {
        return JSON.stringify({ error: "ليس لديك صلاحية." });
      }

      const students = await User.find({
        "academicInfo.enrolledCourses": courseId,
        role: ROLES.STUDENT
      }).select("name studentId academicInfo.level").lean();

      return JSON.stringify({ courseName: course.name, students });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },

  update_attendance_status: async ({ attendanceId, status, reason, user }) => {
    try {
      if (user.role === ROLES.STUDENT) {
        return JSON.stringify({ error: "ليس لديك صلاحية لتعديل الحضور." });
      }

      const record = await AttendanceRecord.findById(attendanceId).populate("course");
      if (!record) return JSON.stringify({ error: "سجل الحضور غير موجود" });

      if (user.role === ROLES.DOCTOR && record.course.doctor.toString() !== user._id.toString()) {
        return JSON.stringify({ error: "لا يمكنك تعديل حضور في كورس لا تدرسه." });
      }

      record.status = status;
      record.modificationReason = reason || "تم التعديل بواسطة المساعد الذكي";
      record.modifiedBy = user._id;
      record.modifiedAt = new Date();
      await record.save();

      return JSON.stringify({ success: true, message: `تم تحديث حالة الحضور إلى ${status}` });
    } catch (e) { return JSON.stringify({ error: e.message }); }
  },

  get_student_attendance: async ({ studentId, courseId, user }) => {
    try {
      let targetStudentId = studentId;
      
      if (user.role === ROLES.STUDENT) {
        targetStudentId = user._id;
      } else if (!targetStudentId) {
        return JSON.stringify({ error: "يجب تحديد معرف الطالب (studentId)." });
      }

      let query = { student: targetStudentId };
      if (courseId) query.course = courseId;

      if (user.role === ROLES.DOCTOR) {
        const myCourses = await Course.find({ doctor: user._id }).select("_id");
        const myCourseIds = myCourses.map(c => c._id.toString());
        
        if (courseId) {
          if (!myCourseIds.includes(courseId.toString())) {
            return JSON.stringify({ error: "لا يمكنك رؤية حضور الطالب في كورس لا تدرسه." });
          }
        } else {
          query.course = { $in: myCourseIds };
        }
      }

      const records = await AttendanceRecord.find(query)
        .populate("course", "name code")
        .populate("lecture", "startTime endTime")
        .sort({ date: -1 })
        .limit(15)
        .lean();

      if (records.length === 0) {
        return JSON.stringify({ message: "لا توجد سجلات حضور لهذا الطالب حالياً." });
      }

      return JSON.stringify(records);
    } catch (e) { return JSON.stringify({ error: e.message }); }
  }
};

/**
 * Tools Definitions for OpenAI/OpenRouter
 */
const tools = [
  {
    type: "function",
    function: {
      name: "get_system_statistics",
      description: "الحصول على إحصائيات النظام بناءً على صلاحيات المستخدم",
      parameters: { type: "object", properties: {}, required: [] },
    }
  },
  {
    type: "function",
    function: {
      name: "list_all_courses",
      description: "عرض الكورسات المتاحة للمستخدم (كل الكورسات للمسؤول، كورسات الدكتور، أو كورسات الطالب المسجل بها)",
      parameters: { type: "object", properties: {}, required: [] },
    }
  },
  {
    type: "function",
    function: {
      name: "search_users",
      description: "البحث عن طلاب أو دكاترة. (المسؤول يرى الجميع، الدكتور يرى طلابه فقط، الطالب لا يمكنه البحث)",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["student", "doctor", "admin"] },
          level: { type: "string", description: "المستوى الدراسي (1-4)" },
          name: { type: "string", description: "جزء من الاسم" }
        }
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_course_students",
      description: "عرض قائمة الطلاب المسجلين في كورس معين (للمسؤول والدكتور المسئول عن الكورس فقط)",
      parameters: {
        type: "object",
        properties: {
          courseId: { type: "string", description: "ID الكورس" }
        },
        required: ["courseId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_attendance_status",
      description: "تعديل حالة حضور طالب في سجل معين (للمسؤول والدكتور المسئول فقط)",
      parameters: {
        type: "object",
        properties: {
          attendanceId: { type: "string", description: "ID سجل الحضور" },
          status: { 
            type: "string", 
            enum: ["present", "absent", "late", "excused"],
            description: "الحالة الجديدة" 
          },
          reason: { type: "string", description: "سبب التعديل" }
        },
        required: ["attendanceId", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_student_attendance",
      description: "عرض سجل حضور طالب معين. الطالب يرى نفسه فقط، الدكتور يرى طلابه في كورساته فقط، المسؤول يرى الجميع.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string", description: "ID الطالب (اختياري للطالب نفسه)" },
          courseId: { type: "string", description: "ID الكورس (اختياري)" }
        }
      }
    }
  }
];

/**
 * Main Chat Function
 */
const chat = async (messages, user = { role: ROLES.ADMIN }) => {
  const model = "openrouter/free";
  const userName = user.name ? `${user.name.first} ${user.name.last}` : "المستخدم";
  
  // Format messages for OpenAI
  let chatMessages = [
    {
      role: "system",
      content: `أنت مساعد ذكي متطور لنظام حضور وغياب جامعي يُدعى "نظام ذكاء الحضور".
      
      معلومات المستخدم الحالي:
      - الاسم: ${userName}
      - الصلاحية: ${user.role}
      - المعرف الشخصي: ${user._id}

      تعليمات هامة:
      1. أجب دائماً باللغة العربية بأسلوب مهذب ومحترف.
      2. التزم بحدود صلاحيات المستخدم الموضحة في الأدوات. إذا طلب المستخدم شيئاً خارج صلاحياته، اعتذر بوضوح.
      3. استخدم الجداول (Markdown Tables) لعرض البيانات المتعددة (مثل قوائم الطلاب أو سجلات الحضور).
      4. عند تعديل الحضور، اطلب تأكيداً من الدكتور قبل التنفيذ إذا لم يكن الطلب صريحاً.
      5. الأدوات المتاحة تجلب البيانات الحقيقية من قاعدة البيانات، استخدمها دائماً قبل الإجابة على أسئلة حول الطلاب أو الكورسات.
      6. إذا كنت دكتور، يمكنك رؤية طلابك وتعديل حضورهم. إذا كنت طالباً، يمكنك فقط رؤية سجلاتك الخاصة.`
    },
    ...messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "")
    }))
  ];

  try {
    for (let i = 0; i < 5; i++) {
      const response = await openai.chat.completions.create({
        model: model,
        messages: chatMessages,
        tools: tools,
        tool_choice: "auto",
      });

      const responseMessage = response.choices[0].message;
      
      // Handle empty content but tool_calls presence
      if (!responseMessage.content && !responseMessage.tool_calls) {
          throw new Error("Empty response from OpenRouter");
      }

      chatMessages.push(responseMessage);

      if (responseMessage.tool_calls) {
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          let functionArgs = {};
          
          try {
            functionArgs = JSON.parse(toolCall.function.arguments || "{}");
          } catch (e) {
            console.error(`[OpenRouter] Error parsing tool arguments for ${functionName}:`, e);
            functionArgs = {};
          }
          
          if (!functionArgs || typeof functionArgs !== "object") {
            functionArgs = {};
          }

          // Inject user context into function arguments
          functionArgs.user = user;
          
          console.log(`[OpenRouter] Executing: ${functionName} for user: ${user.email}`);
          const toolResult = await toolImplementations[functionName](functionArgs);
          
          chatMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: toolResult,
          });
        }
        continue;
      }

      return responseMessage.content;
    }
    
    return chatMessages[chatMessages.length - 1].content;

  } catch (error) {
    console.error("[OpenRouter Error]:", error);
    throw new Error(`خطأ في الاتصال بـ OpenRouter: ${error.message}`);
  }
};

module.exports = { chat };

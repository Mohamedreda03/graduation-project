# 📊 التوثيق الشامل والمفصل لمتحكم الحضور (Attendance Controller)

* **اسم الملف الأصلي:** [attendance.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/attendance.controller.js)
* **المسار البرمجي:** `backend/src/controllers/attendance.controller.js`
* **المسؤولية الأساسية:** استخراج تقارير الحضور والغياب، عرض الحضور اللحظي في القاعات، تعديل كشوف الحضور يدوياً مع تتبع التعديلات، تصدير التقارير بصيغة CSV، وتحديد الطلاب المعرضين لخطر الحرمان (At-Risk Students) بناءً على نسب حضورهم.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/attendance` | الأدمن والدكتور | جلب كافة سجلات الحضور مع الفلترة والتقسيم |
| **GET** | `http://localhost:5000/api/attendance/my` | الطالب فقط | جلب سجلات حضور الطالب الحالي في كافة المواد |
| **GET** | `http://localhost:5000/api/attendance/my/course/:courseId` | الطالب فقط | جلب إحصائيات وسجل حضور الطالب في مادة معينة |
| **GET** | `http://localhost:5000/api/attendance/lecture/:lectureId` | الأدمن والدكتور | جلب كشف حضور الطلاب في محاضرة محددة بتاريخ معين |
| **GET** | `http://localhost:5000/api/attendance/live/:hallId` | الأدمن والدكتور | جلب الطلاب المتواجدين حالياً في القاعة (حضور لحظي) |
| **GET** | `http://localhost:5000/api/attendance/at-risk` | الأدمن والدكتور | تحديد الطلاب الذين تقل نسبة حضورهم عن حد معين |
| **PUT** | `http://localhost:5000/api/attendance/:id` | الأدمن والدكتور | تعديل حالة حضور طالب يدوياً مع ذكر السبب |
| **PUT** | `http://localhost:5000/api/attendance/:id/excuse` | الأدمن والدكتور | تسجيل غياب طالب بعذر مقبول |
| **GET** | `http://localhost:5000/api/attendance/course/:courseId/report` | الأدمن والدكتور | جلب تقرير حضور تفصيلي لجميع طلاب مقرر دراسي معين |
| **GET** | `http://localhost:5000/api/attendance/course/:courseId/export` | الأدمن والدكتور | تصدير كشف حضور المقرر في ملف Excel/CSV للتحميل |
| **GET** | `http://localhost:5000/api/attendance/daily-summary` | الأدمن والدكتور | إحصائيات الحضور الإجمالية اليومية |
| **GET** | `http://localhost:5000/api/attendance/weekly-summary` | الأدمن والدكتور | تقرير وإحصائيات الحضور الأسبوعية المقسمة يومياً |
| **GET** | `http://localhost:5000/api/attendance/my/status` | الطالب فقط | Polling لتطبيق Flutter لمعرفة حالة المحاضرة الحالية |

---

## 🧠 التصميم المنطقي والحلول البرمجية للمشكلات الفنية

### 1. عزل الصلاحيات واستعراض البيانات (Data Isolation)
لا يصح للدكتور رؤية تقارير الحضور لمواد يدرسها دكاترة آخرون، بينما يجب للأدمن رؤية كل شيء.
* **الحل البرمجي:** في الاستعلامات العامة مثل `getAllAttendance`، يفحص الكود دور المستخدم: إذا كان `doctor`، يتم جلب المواد التي يقوم بتدريسها أولاً من جدول [Course](file:///d:/work-now/graduation-project/backend/src/models/Course.js)، ثم يتم إجبار الاستعلام على الفلترة داخل نطاق هذه المواد فقط (`query.course = { $in: doctorCourses }`).

### 2. الحضور اللحظي الفعلي (Live Attendance Monitoring)
كيف يرى الدكتور الطلاب الجالسين أمامه في القاعة حالياً؟
* **الحل البرمجي:** يتم دمج جدولين في نفس الوقت:
  1. جدول [StudentSession](file:///d:/work-now/graduation-project/backend/src/models/StudentSession.js) للحصول على الهواتف المتصلة بالواي فاي حالياً ونشطة (`isActive: true`).
  2. جدول [AttendanceRecord](file:///d:/work-now/graduation-project/backend/src/models/AttendanceRecord.js) للحصول على سجلات الحضور التي ما زالت بحالة قيد المعالجة (`in-progress`).
  يتيح هذا للدكتور رؤية من دخل، متى دخل، وإجمالي الدقائق التراكمية التي قضاها الطالب في القاعة حتى اللحظة الحالية.

### 3. خوارزمية التنبؤ بالطلاب المهددين بالحرمان (At-Risk Algorithm)
لحماية الطلاب من الحرمان وتنبيههم مبكراً، يحتاج النظام لحساب نسب حضور الطلاب وتصفية من هم تحت خط الخطر (مثال: أقل من 75%).
* **الحل البرمجي:** نظراً لأن حساب هذه النسب لآلاف الطلاب يتطلب معالجة ضخمة، تم تصميم **قناة تجميع متقدمة (Aggregation Pipeline)** في MongoDB لحساب البيانات داخل قاعدة البيانات مباشرة بـ 5 مراحل متتالية لضمان السرعة والكفاءة، بدلاً من جلب البيانات ومعالجتها في سيرفر Node.js.

### 4. حماية البيانات من التلاعب وتتبع التعديل اليدوي (Auditing)
قد يطلب طالب من الدكتور تعديل غيابه يدوياً لأسباب مختلفة، ويجب ضبط هذه العملية لمنع إساءة استخدام الصلاحيات.
* **الحل البرمجي:** لا يتم مسح أو تغيير الحالة ببساطة، بل يفرض النظام عند التعديل اليدوي تسجيل:
  1. الهوية الفريدة للدكتور الذي قام بالتعديل (`modifiedBy`).
  2. السبب المكتوب للتعديل (`modificationReason`).
  3. تاريخ وساعة التعديل بدقة (`modifiedAt`).
  هذا يضمن الحفاظ على سجل كامل وقابل للمراجعة (Audit Log) لأي تغيير يدوي يحدث على البيانات التلقائية المأخوذة من الشبكة.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية تحديد الطلاب المهددين بالحرمان: `getAtRiskStudents`
* **موقع الكود:** [attendance.controller.js:L207](file:///d:/work-now/graduation-project/backend/src/controllers/attendance.controller.js#L207)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getAtRiskStudents = catchAsync(async (req, res, next) => {
  const { course: courseId, threshold = 75 } = req.query;
  const matchStage = { isFinalized: true }; // معالجة السجلات المعتمدة فقط

  // 1. تحديد نطاق البحث للدكاترة
  if (req.user.role === ROLES.DOCTOR) {
    const doctorCourses = await Course.find({ doctor: req.user._id }).select("_id");
    matchStage.course = { $in: doctorCourses.map((c) => c._id) };
  }

  // 2. تشغيل قناة التجميع (Aggregation Pipeline) لسرعة المعالجة
  const atRiskData = await AttendanceRecord.aggregate([
    { $match: matchStage }, // تصفية السجلات الابتدائية
    {
      $group: {
        // تجميع السجلات لكل طالب في كل مقرر دراسي
        _id: { student: "$student", course: "$course" },
        total: { $sum: 1 }, // حساب إجمالي المحاضرات المعقودة
        present: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0], // حساب أيام الحضور والتأخير
          },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }, // حساب أيام الغياب
        },
      },
    },
    {
      $project: {
        student: "$_id.student",
        course: "$_id.course",
        total: 1,
        present: 1,
        absent: 1,
        // حساب نسبة الحضور المئوية
        attendanceRate: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    { $match: { attendanceRate: { $lt: parseFloat(threshold) } } }, // تصفية من هم تحت نسبة الخطر
    { $sort: { attendanceRate: 1 } }, // الترتيب من الأقل حضوراً للأعلى
    { $limit: 50 }, // جلب أعلى 50 طالباً معرضاً للخطر
  ]);

  // 3. ربط النتائج ببيانات الطلاب والمواد وإرجاع الرد
  // ...
});
```

---

### 2. الحضور اللحظي الفعلي: `getLiveAttendance`
* **موقع الكود:** [attendance.controller.js:L167](file:///d:/work-now/graduation-project/backend/src/controllers/attendance.controller.js#L167)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getLiveAttendance = catchAsync(async (req, res, next) => {
  const { hallId } = req.params;

  // 1. جلب الهواتف المتصلة بالواي فاي حالياً ونشطة
  const sessions = await StudentSession.find({
    currentHall: hallId,
    isActive: true,
  }).populate("student", "studentId name");

  // 2. جلب سجلات الحضور المفتوحة والغير مقفلة لليوم
  const today = getTodayDate();
  const records = await AttendanceRecord.find({
    hall: hallId,
    date: today,
    status: ATTENDANCE_STATUS.IN_PROGRESS,
  }).populate("student", "studentId name");

  // 3. إرجاع دمج بين الجدولين لمعرفة زمن التواجد الفعلي للطالب المتصل حالياً
  res.status(200).json({
    success: true,
    data: {
      activeSessions: sessions.length,
      sessions: sessions.map((s) => ({
        student: s.student,
        connectedAt: s.connectedAt,
        macAddress: s.macAddress,
      })),
      inProgressRecords: records.length,
      records: records.map((r) => ({
        student: r.student,
        checkIn: r.sessions[r.sessions.length - 1]?.checkIn,
        totalTime: r.totalPresenceTime,
      })),
    },
  });
});
```

---

### 3. تصدير التقارير لملف CSV وتحميلها: `exportAttendanceReport`
* **موقع الكود:** [attendance.controller.js:L448](file:///d:/work-now/graduation-project/backend/src/controllers/attendance.controller.js#L448)

#### 📝 الكود البرمجي المهم:
```javascript
exports.exportAttendanceReport = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate("students", "studentId name")
    .select("name code students");

  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // 1. بناء هيكل ملف الـ CSV
  let csvContent = "Student ID,Name,Total Lectures,Present,Absent,Attendance Rate\n";

  for (const student of course.students) {
    const totalRecords = await AttendanceRecord.countDocuments({
      student: student._id,
      course: courseId,
      isFinalized: true,
    });

    const presentRecords = await AttendanceRecord.countDocuments({
      student: student._id,
      course: courseId,
      isFinalized: true,
      status: "present",
    });

    const absentRecords = totalRecords - presentRecords;
    const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    const name = `${student.name?.first || ""} ${student.name?.last || ""}`.trim();

    // إضافة سطر لكل طالب
    csvContent += `${student.studentId},"${name}",${totalRecords},${presentRecords},${absentRecords},${rate}%\n`;
  }

  // 2. كتابة الـ Headers الأمنية في الرد لتحفيز المتصفح على تحميل الملف مباشرة
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${course.code}_attendance.csv"`,
  );
  res.status(200).send(csvContent);
});
```

# 📅 التوثيق الشامل والمفصل لمتحكم المحاضرات (Lectures Controller)

* **اسم الملف الأصلي:** [lectures.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/lectures.controller.js)
* **المسار البرمجي:** `backend/src/controllers/lectures.controller.js`
* **المسؤولية الأساسية:** إدارة الجدول الدراسي الأسبوعي وتجنب تعارض القاعات والمواعيد، وتوفير آليات التحكم اليدوي للدكتور لبدء وإنهاء وإلغاء المحاضرات، مع إجراء عمليات تنظيف البيانات وإغلاق الجلسات المعلقة تلقائياً في قاعدة البيانات عند انتهاء المحاضرة.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/lectures` | الأدمن والدكتور | جلب كافة المحاضرات النشطة مع إمكانية الفلترة |
| **GET** | `http://localhost:5000/api/lectures/:id` | الأدمن والدكتور | جلب بيانات محاضرة معينة بالتفصيل |
| **POST** | `http://localhost:5000/api/lectures` | الأدمن فقط | حجز موعد محاضرة جديد في جدول القاعة |
| **PUT** | `http://localhost:5000/api/lectures/:id` | الأدمن فقط | تعديل وقت أو قاعة أو بيانات محاضرة مجدولة |
| **DELETE** | `http://localhost:5000/api/lectures/:id` | الأدمن فقط | إلغاء تفعيل (تعطيل) المحاضرة من الجدول |
| **GET** | `http://localhost:5000/api/lectures/current` | الأدمن والدكتور | جلب المحاضرات الجارية حالياً في الجامعة |
| **GET** | `http://localhost:5000/api/lectures/my-schedule` | الطالب والدكتور | جلب الجدول الدراسي الأسبوعي للمستخدم الحالي |
| **GET** | `http://localhost:5000/api/lectures/today` | الأدمن والدكتور | جلب جميع المحاضرات المجدولة لليوم الحالي |
| **GET** | `http://localhost:5000/api/lectures/by-date` | الأدمن والدكتور | جلب المحاضرات المطابقة ليوم معين في التاريخ |
| **GET** | `http://localhost:5000/api/lectures/week-schedule` | الأدمن والدكتور | جلب جدول الأسبوع بالكامل لقاعة أو مقرر معين |
| **POST** | `http://localhost:5000/api/lectures/schedule` | الأدمن فقط | جدولة وحجز المحاضرات المتكررة بالترم |
| **POST** | `http://localhost:5000/api/lectures/:id/start` | الدكتور المسؤول | تفعيل وبدء المحاضرة يدوياً من الطبيب |
| **POST** | `http://localhost:5000/api/lectures/:id/end` | الدكتور المسؤول | إنهاء المحاضرة يدوياً وإغلاق كشوف الحضور والغياب |
| **POST** | `http://localhost:5000/api/lectures/:id/cancel` | الدكتور المسؤول | إلغاء محاضرة اليوم بجدول الدكتور |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للنظام

### 1. خوارزمية منع تعارض القاعات والمواعيد (Time Conflict Resolution)
عند إضافة أو تعديل محاضرة في قاعة معينة، يجب أن يضمن النظام عدم تداخل المواعيد مع أي محاضرة أخرى محجوزة مسبقاً في نفس القاعة ونفس اليوم الدراسي.
* **المعادلة الرياضية للتداخل:** لتحديد تداخل فترتين زمنيتين الأولى $[S_1, E_1]$ والثانية $[S_2, E_2]$، تكون الفترتان متداخلتين إذا تحقق الشرط التالي:
  $$\text{Overlap} \iff (S_1 < E_2) \land (E_1 > S_2)$$
* **الحل البرمجي:** ترجمة هذه المعادلة لاستعلام في قاعدة البيانات عبر MongoDB Query:
  ```javascript
  const conflictingLecture = await Lecture.findOne({
    hall,
    dayOfWeek,
    isActive: true,
    $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }]
  });
  ```
  هذا الاستعلام يفحص بكفاءة عالية أي تداخل زمني ويمنع حجز القاعة لأكثر من محاضرة في نفس الوقت.

### 2. آلية إنهاء المحاضرة يدويًا وتنظيف البيانات (Transactional Cleanup)
ماذا يحدث عندما يضغط الدكتور على زر "إنهاء المحاضرة" في لوحة التحكم الخاصة به؟
لا يقتصر الأمر على تغيير حالة المحاضرة إلى `completed` فقط، بل يتطلب تحديث كلي لقاعدة البيانات لمنع حدوث جلسات معلقة أو تسجيل حضور بعد انتهاء وقتها:
1. **الخطوة أ:** قفل جميع كشوف حضور الطلاب المفتوحة حالياً لهذه المحاضرة في [AttendanceRecord](file:///d:/work-now/graduation-project/backend/src/models/AttendanceRecord.js) وتحويل حالتها لـ `present`.
2. **الخطوة ب:** تحديث فترات الدخول المفتوحة (التي لم يُسجل لها خروج بسبب عدم انقطاع الطالب) وإغلاقها بتوقيت إنهاء المحاضرة، وحساب الدقائق المتبقية وإضافتها لعداد الحضور الفعلي.
3. **الخطوة ج:** تحديث جماعي لجدول [StudentSession](file:///d:/work-now/graduation-project/backend/src/models/StudentSession.js) لإغلاق كل الجلسات النشطة في هذه القاعة فوراً وتحويل `isActive` لـ `false`. هذا يوقف عمليات الـ Polling تلقائياً في تطبيق الموبايل للطلاب ويظهر لهم شاشة نهاية المحاضرة.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية فحص التعارض والجدولة: `createLecture`
* **موقع الكود:** [lectures.controller.js:L63](file:///d:/work-now/graduation-project/backend/src/controllers/lectures.controller.js#L63)

#### 📝 الكود البرمجي المهم:
```javascript
exports.createLecture = catchAsync(async (req, res, next) => {
  const { course: courseId, hall, dayOfWeek, startTime, endTime } = req.body;

  // 1. التحقق من عدم وجود تعارض زمني في القاعة لنفس اليوم الدراسي
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

  // 2. جلب بيانات المادة لاستنساخ معلومات المستوى والتخصص لتسريع البحث لاحقاً
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

  // 3. كتابة المحاضرة في جدول قاعدة البيانات
  const lecture = await Lecture.create(lectureData);

  res.status(201).json({
    success: true,
    data: lecture,
  });
});
```

---

### 2. إغلاق المحاضرة يدوياً وتنظيف قاعدة البيانات: `endLecture`
* **موقع الكود:** [lectures.controller.js:L427](file:///d:/work-now/graduation-project/backend/src/controllers/lectures.controller.js#L427)

#### 📝 الكود البرمجي المهم:
```javascript
exports.endLecture = catchAsync(async (req, res, next) => {
  const lecture = await Lecture.findById(req.params.id)
    .populate("course hall doctor");

  if (!lecture) {
    throw ApiError.notFound("Lecture not found");
  }

  // 1. تحديث حالة المحاضرة
  lecture.status = "completed";
  await lecture.save();

  // 2. استرجاع كشوف الحضور للطلاب التي ما زالت بحالة قيد المعالجة (in-progress)
  const records = await AttendanceRecord.find({
    lecture: lecture._id,
    status: ATTENDANCE_STATUS.IN_PROGRESS,
  });

  const now = new Date();

  for (const record of records) {
    record.status = ATTENDANCE_STATUS.PRESENT;

    // إغلاق أي جلسات فرعية داخل السجل لم يُسجل لها خروج
    if (record.sessions && record.sessions.length > 0) {
      const lastSession = record.sessions[record.sessions.length - 1];
      if (!lastSession.checkOut) {
        lastSession.checkOut = now;

        // حساب الدقائق المتبقية وإضافتها لعداد الحضور الفعلي
        const diffMs = now - lastSession.checkIn;
        const diffMins = Math.floor(diffMs / 1000 / 60);
        lastSession.duration = diffMins;
        record.totalPresenceTime += diffMins;
      }
    }
    await record.save(); // حفظ تحديثات كشف حضور الطالب
  }

  // 3. التحديث الجماعي لإغلاق الجلسات النشطة للطلاب لمنع الـ Polling من تطبيق الموبايل
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
```

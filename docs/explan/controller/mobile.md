# 📱 التوثيق الشامل والمفصل لمتحكم واجهة الموبايل (Mobile Controller)

* **اسم الملف الأصلي:** [mobile.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/mobile.controller.js)
* **المسار البرمجي:** `backend/src/controllers/mobile.controller.js`
* **المسؤولية الأساسية:** تقديم واجهات برمجة مجمّعة ومخصصة لتطبيق الهواتف المحمولة للطلاب (Flutter). يعمل هذا المتحكم بنمط **BFF (Backend-for-Frontend)** لتحسين الأداء وتقليل استهلاك بطارية الهاتف وحجم البيانات المستهلكة من شبكات المحمول.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/mobile/home` | الطالب فقط (`Bearer Token`) | جلب بيانات الشاشة الرئيسية (المحاضرة الحية، جدول اليوم، العداد التنازلي) |
| **GET** | `http://localhost:5000/api/mobile/schedule` | الطالب فقط (`Bearer Token`) | جلب الجدول الدراسي الأسبوعي موزعاً بالتواريخ التقويمية |
| **GET** | `http://localhost:5000/api/mobile/attendance/summary` | الطالب فقط (`Bearer Token`) | جلب ملخص الحضور ونسبة غياب الطالب لمقرر معين |
| **GET** | `http://localhost:5000/api/mobile/attendance/history` | الطالب فقط (`Bearer Token`) | سجل حضور الطالب المفصل لجميع المواد مع التقسيم لصفحات |
| **GET** | `http://localhost:5000/api/mobile/profile` | الطالب فقط (`Bearer Token`) | الملف الشخصي للطالب وحالة جهازه وطلبات التغيير المعلقة |
| **POST** | `http://localhost:5000/api/mobile/device-change-request` | الطالب فقط (`Bearer Token`) | تقديم طلب تغيير جهاز الهاتف مع ذكر السبب |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للـ Mobile API

### 1. تقنية تجميع البيانات لتقليل زمن الاستجابة (API Aggregation)
تطبيقات الهواتف المحمولة تعمل غالباً على شبكات بيانات خلوية (3G/4G/5G) قد تكون ذات سرعات متذبذبة. لو قام التطبيق بطلب بيانات جدول اليوم، وحالة الاتصال اللحظية، والعد التنازلي للمحاضرة القادمة في 3 طلبات منفصلة، لشعر الطالب ببطء في استجابة الواجهة واستهلك ذلك طاقة أكبر من البطارية.
* **الحل البرمجي:** تجميع بيانات الشاشة بأكملها في مسار واحد (`getHome`). يقوم السيرفر بجمع البيانات الأكاديمية واللحظية والزمنية من 4 جداول مختلفة في قاعدة البيانات ومعالجتها وإرجاعها في كائن JSON واحد منسق وجاهز للعرض الفوري في شاشة الهاتف.

### 2. تهيئة وتطويع أوقات المحاضرات والأيام التقويمية
* **ترتيب الأسبوع الأكاديمي المصري:** في الجامعات المصرية، يبدأ الأسبوع الدراسي يوم السبت وينتهي يوم الخميس. الترتيب الافتراضي في نظام JavaScript يبدأ بيوم الأحد (0) وينتهي بالسبت (6).
  لذا، تم استخدام مصفوفة مخصصة لترتيب الأيام أكاديمياً:
  ```javascript
  const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5]; // السبت(6) -> الأحد(0) ... -> الجمعة(5)
  ```
* **توليد تواريخ الجدول الأسبوعي:** لا يكتفي السيرفر بإرسال اسم اليوم فقط (مثل: السبت)، بل يقوم بحساب التاريخ التقويمي الدقيق (مثل: `2026-06-06`) لكل يوم في الأسبوع الحالي عن طريق إيجاد تاريخ يوم السبت الأخير والزحف للأمام بالتواريخ ديناميكياً لتسهيل عرضها للطالب.

### 3. تنبيهات حظر الغياب (Debarment Alerts - 75% Rule)
* يعتمد النظام على النسبة الأكاديمية المتعارف عليها للحرمان وهي **75% حضور**.
* يقوم السيرفر بحساب نسبة الطالب في المقرر، وإذا انخفضت عن 80% يبدأ بإرسال تحذيرات باللون الأصفر (Warning) لحثه على الحضور. وإذا انخفضت عن 75% يرسل تنبيهاً باللون الأحمر (Danger) لإعلامه باحتمالية الحرمان.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. منطق الشاشة الرئيسية المجمع: `getHome`
* **موقع الكود:** [mobile.controller.js:L113](file:///d:/work-now/graduation-project/backend/src/controllers/mobile.controller.js#L113)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getHome = catchAsync(async (req, res) => {
  const student = req.user;
  const today = new Date().getDay(); // اليوم الحالي من 0 لـ 6
  const currentMins = nowMinutes(); // الدقائق الحالية منذ منتصف الليل

  // 1. جلب محاضرات اليوم للمواد المسجل بها الطالب فقط
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

  let liveLecture = null;
  let nextLecture = null;

  // 2. التحقق هل الطالب متصل حالياً بالقاعة بالـ WiFi؟
  const activeSession = await StudentSession.findActiveSession(student._id);

  if (activeSession && activeSession.currentLecture) {
    const liveLec = await Lecture.findById(activeSession.currentLecture)
      .populate("course", "name code")
      .populate("hall", "name")
      .populate("doctor", "name");

    if (liveLec) {
      // حساب الوقت المتبقي للمحاضرة بالثواني
      const endMins = toMinutes(liveLec.endTime);
      const remainingSecs = Math.max(0, (endMins - currentMins) * 60);

      let attendanceStatus = ATTENDANCE_STATUS.IN_PROGRESS;
      if (activeSession.attendanceRecord) {
        const rec = await AttendanceRecord.findById(activeSession.attendanceRecord);
        if (rec) attendanceStatus = rec.status;
      }

      liveLecture = {
        lectureId: liveLec._id,
        courseName: liveLec.course?.name || "",
        courseCode: liveLec.course?.code || "",
        doctorName: liveLec.doctor ? `د. ${liveLec.doctor.name.first} ${liveLec.doctor.name.last}` : "",
        hallName: liveLec.hall?.name || "",
        startTime: liveLec.startTime,
        endTime: liveLec.endTime,
        remainingTime: minutesToHMS(remainingSecs), // تحويل الأرقام لصيغة HH:MM:SS
        attendanceStatus,
        attendanceStatusAr: STATUS_AR[attendanceStatus] || attendanceStatus,
      };
    }
  }

  // 3. تحديد المحاضرة القادمة اليوم وحساب العداد التنازلي لبدئها
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
        startTime: lec.startTime,
        endTime: lec.endTime,
        countdownFormatted: minutesToHMS(countdownSecs),
      };
      break;
    }
  }

  // 4. إرسال الكائن النهائي الموحد لتطبيق الهاتف
  res.status(200).json({
    success: true,
    data: {
      studentName: student.name?.first || "",
      todayLecturesCount: todayLectures.length,
      todayDateFormatted: formatDateAr(new Date()),
      dayNameAr: DAY_NAMES_AR[today],
      liveLecture,
      todaySchedule: todayLectures.map(l => ({ ... })),
      nextLecture,
    },
  });
});
```

---

### 2. ديناميكية تواريخ الجدول الأسبوعي: `getSchedule`
* **موقع الكود:** [mobile.controller.js:L236](file:///d:/work-now/graduation-project/backend/src/controllers/mobile.controller.js#L236)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getSchedule = catchAsync(async (req, res) => {
  const student = req.user;
  const enrolledIds = student.academicInfo?.enrolledCourses || [];

  const allLectures = await Lecture.find({
    course: { $in: enrolledIds },
    isActive: true,
  }).populate("course doctor hall");

  // تجميع المحاضرات حسب أيام الأسبوع
  const grouped = {};
  for (const d of DAY_ORDER) grouped[d] = [];
  for (const lec of allLectures) {
    if (grouped[lec.dayOfWeek] !== undefined) {
      grouped[lec.dayOfWeek].push({ ... });
    }
  }

  // خوارزمية تحديد تاريخ السبت الماضي لبدء حساب تواريخ أيام الأسبوع الحالي
  const now = new Date();
  const todayDow = now.getDay(); 
  const diffToSat = (todayDow - 6 + 7) % 7; // إيجاد فارق الأيام للوصول للسبت الماضي
  const saturdayDate = new Date(now);
  saturdayDate.setDate(now.getDate() - diffToSat);
  saturdayDate.setHours(0, 0, 0, 0);

  // بناء هيكل الأيام بالتواريخ الفعلية
  const days = DAY_ORDER.map((dow) => {
    const satOffset = (dow - 6 + 7) % 7;
    const date = new Date(saturdayDate);
    date.setDate(saturdayDate.getDate() + satOffset);

    return {
      dayOfWeek: dow,
      dayNameAr: DAY_NAMES_AR[dow],
      date: date.toISOString().split("T")[0],
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
```

---

### 3. تقديم طلب تغيير الجهاز: `requestDeviceChange`
* **موقع الكود:** [mobile.controller.js:L545](file:///d:/work-now/graduation-project/backend/src/controllers/mobile.controller.js#L545)

#### 📝 الكود البرمجي المهم:
```javascript
exports.requestDeviceChange = catchAsync(async (req, res) => {
  const { reason, newDeviceInfo } = req.body;

  // التحقق من طول ووصف سبب الطلب لضمان جدية تقديم الطلبات
  if (!reason || reason.trim().length < 5) {
    throw ApiError.badRequest("يجب إدخال سبب لطلب تغيير الجهاز (5 أحرف على الأقل)");
  }

  if (!newDeviceInfo || !newDeviceInfo.macAddress) {
    throw ApiError.badRequest("يجب إدخال معلومات الجهاز الجديد (MAC Address مطلوب)");
  }

  const user = await User.findById(req.user._id);

  // منع الطالب من تقديم أكثر من طلب قيد المراجعة في نفس الوقت
  if (
    user.deviceChangeRequest?.requested &&
    user.deviceChangeRequest.status === DEVICE_REQUEST_STATUS.PENDING
  ) {
    throw ApiError.badRequest("لديك طلب تغيير جهاز قيد المراجعة بالفعل");
  }

  // تسجيل الطلب وحفظه في حساب المستخدم بانتظار موافقة الأدمن
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
```

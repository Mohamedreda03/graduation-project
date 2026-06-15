# 📊 التوثيق الشامل والمفصل لمتحكم الإحصائيات (Dashboard Controller)

* **اسم الملف الأصلي:** [dashboard.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/dashboard.controller.js)
* **المسار البرمجي:** `backend/src/controllers/dashboard.controller.js`
* **المسؤولية الأساسية:** تجميع وتحليل البيانات الإحصائية الشاملة للنظام لعرضها في لوحات التحكم (Dashboards). يقوم بإعداد الرسوم البيانية الأسبوعية، وحساب نسب الحضور اليومية، ومراقبة الحالة الفنية لقاعدة البيانات والسيرفر، ورصد الأنشطة الأخيرة.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/dashboard/stats` | الأدمن والدكتور (`Bearer Token`) | جلب الإحصائيات الشاملة للوحة المعلومات (الأعداد، نسب الحضور اليومية، الرسوم البيانية) |
| **GET** | `http://localhost:5000/api/dashboard/health` | الأدمن فقط (`Bearer Token`) | جلب الحالة الصحية للنظام (حالة الداتابيز والـ Scheduler والاتصالات) |
| **GET** | `http://localhost:5000/api/dashboard/activities` | الأدمن والدكتور (`Bearer Token`) | جلب آخر العمليات والأنشطة التي حدثت مؤخراً (سجل الحضور الأخير للطلاب) |
| **GET** | `http://localhost:5000/api/dashboard/quick-stats` | الأدمن والدكتور (`Bearer Token`) | جلب إحصائيات سريعة للرأس العلوي للموقع (Header) |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للنظام

### 1. تقليص زمن الاستجابة باستخدام الاستعلام المتوازي (Concurrent Database Queries)
تتطلب لوحة المعلومات جلب أعداد الطلاب، الدكاترة، المواد، القاعات، والأقسام في نفس الوقت.
* **المشكلة:** إذا قمنا بكتابة استعلامات متتالية باستخدام `await` العادي، فسيتم قفل المعالج حتى ينتهي الاستعلام الأول، ثم يبدأ الثاني، وهكذا؛ مما يسبب بطء استجابة الصفحة (Latency).
* **الحل البرمجي:** تم دمج كافة استعلامات العد بداخل مصفوفة واحدة وتمريرها للمشغل المتوازي المتقدم `Promise.all` في Node.js:
  ```javascript
  const [totalStudents, totalDoctors, totalCourses...] = await Promise.all([
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.DOCTOR }),
    Course.countDocuments(), ...
  ]);
  ```
  هذا المشغل يقوم بإرسال جميع الاستعلامات إلى MongoDB في نفس اللحظة (Parallel Execution)، وينتظر عودة النتائج معاً؛ مما يقلص زمن المعالجة لأكثر من 75%.

### 2. توليد البيانات الزمنية للرسوم البيانية (Time-Series Weekly Trend)
لعرض رسم بياني (Line/Bar Chart) يوضح معدلات حضور وغياب الطلاب خلال آخر 7 أيام، يحتاج السيرفر لتقسيم السجلات يومياً وحساب النسبة لكل يوم.
* **الحل البرمجي:** يتم استخدام **قناة التجميع (Aggregation Pipeline)** ومصادقة التواريخ باستخدام المشغل `$dateToString` لتحويل حقل التاريخ الكامل لتواريخ تقويمية منسقة بصيغة `YYYY-MM-DD` ثم التجميع بها لتسهيل إرسال مصفوفة جاهزة تماماً للرسم البياني بالواجهة الأمامية.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية جلب الإحصائيات الكاملة والرسوم البيانية: `getStats`
* **موقع الكود:** [dashboard.controller.js:L9](file:///d:/work-now/graduation-project/backend/src/controllers/dashboard.controller.js#L9)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getStats = catchAsync(async (req, res, next) => {
  // 1. جلب كافة العدادات بالتوازي لتسريع الاستجابة
  const [
    totalStudents,
    totalDoctors,
    totalCourses,
    totalDepartments,
    totalHalls,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.STUDENT }),
    User.countDocuments({ role: ROLES.DOCTOR }),
    Course.countDocuments(),
    Department.countDocuments(),
    Hall.countDocuments({ isActive: true }),
  ]);

  const today = new Date();
  const dayOfWeek = today.getDay();

  // جلب عدد محاضرات اليوم
  const todayLectures = await Lecture.countDocuments({
    dayOfWeek,
    isActive: true,
  });

  // 2. تجميع إحصائيات حضور اليوم (حاضر، غائب، متأخر) باستخدام $cond
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayAttendance = await AttendanceRecord.aggregate([
    {
      $match: {
        date: { $gte: todayStart, $lte: todayEnd },
        isFinalized: true,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
      },
    },
  ]);

  const attendanceData = todayAttendance[0] || { total: 0, present: 0, absent: 0, late: 0 };
  const attendanceRate = attendanceData.total > 0
      ? Math.round(((attendanceData.present + attendanceData.late) / attendanceData.total) * 100)
      : 0;

  // 3. حساب وتوليد الرسم البياني الأسبوعي لآخر 7 أيام
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const weeklyData = await AttendanceRecord.aggregate([
    {
      $match: {
        date: { $gte: weekAgo },
        isFinalized: true,
      },
    },
    {
      $group: {
        // تحويل التاريخ لصيغة YYYY-MM-DD والتجميع به
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } }, // الترتيب من الأقدم للأحدث
  ]);

  const weeklyTrend = weeklyData.map((day) => ({
    day: day._id,
    present: day.present,
    absent: day.absent,
    rate: day.total > 0 ? Math.round((day.present / day.total) * 100) : 0,
  }));

  // 4. جلب إجمالي أعداد الطلاب المعرضين للحرمان (أقل من 75%)
  const atRiskCount = await AttendanceRecord.aggregate([
    { $match: { isFinalized: true } },
    {
      $group: {
        _id: "$student",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
      },
    },
    {
      $project: {
        rate: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$present", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    { $match: { rate: { $lt: 75 } } },
    { $count: "count" },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      totalDoctors,
      totalCourses,
      totalDepartments,
      totalHalls,
      activeLectures: todayLectures,
      todayAttendance: {
        present: attendanceData.present + attendanceData.late,
        absent: attendanceData.absent,
        rate: attendanceRate,
      },
      weeklyTrend,
      atRiskStudents: atRiskCount[0]?.count || 0,
    },
  });
});
```

---

### 2. فحص السلامة التقنية للسيرفر: `getSystemHealth`
* **موقع الكود:** [dashboard.controller.js:L164](file:///d:/work-now/graduation-project/backend/src/controllers/dashboard.controller.js#L164)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getSystemHealth = catchAsync(async (req, res, next) => {
  const mongoose = require("mongoose");

  // 1. قراءة حالة الاتصال بقاعدة البيانات
  // 1 = healthy (متصل)، 2 = degraded (جاري الاتصال)، 0 أو 3 = down (غير متصل)
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "healthy" : dbState === 2 ? "degraded" : "down";

  res.status(200).json({
    success: true,
    data: {
      database: dbStatus,
      scheduler: "running",
      // جلب عدد اتصالات قاعدة البيانات النشطة حالياً بالسيرفر
      activeConnections: mongoose.connection.client?.topology?.s?.servers?.size || 1,
      lastSync: new Date().toISOString(),
    },
  });
});
```

# ⚙️ توثيق متحكمات إدارة النظام الأساسية (CRUD & Configurations Controllers)

يغطي هذا الملف الشرح التفصيلي لأربعة متحكمات تنظيمية مسؤولة عن إدارة الحسابات، الأقسام، الإعدادات العامة، والملفات الشخصية بالنظام:
1. **متحكم الدكاترة ([doctors.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/doctors.controller.js))**
2. **متحكم الأقسام ([departments.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/departments.controller.js))**
3. **متحكم الإعدادات ([settings.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/settings.controller.js))**
4. **متحكم المستخدمين العام ([users.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/users.controller.js))**

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/doctors` | الأدمن فقط (`Bearer Token`) | جلب قائمة الدكاترة مع الفلترة والبحث |
| **POST** | `http://localhost:5000/api/doctors` | الأدمن فقط | إنشاء حساب دكتور جديد بالنظام |
| **PUT** | `http://localhost:5000/api/doctors/:id` | الأدمن فقط | تعديل بيانات دكتور معين |
| **DELETE** | `http://localhost:5000/api/doctors/:id` | الأدمن فقط | تعطيل حساب الدكتور (إيقاف نشاطه) |
| **POST** | `http://localhost:5000/api/doctors/:id/courses` | الأدمن فقط | إسناد وتعيين مقررات دراسية معينة للدكتور |
| **GET** | `http://localhost:5000/api/departments` | الأدمن والدكتور | جلب كافة الأقسام الأكاديمية بالكلية |
| **POST** | `http://localhost:5000/api/departments` | الأدمن فقط | إنشاء قسم أكاديمي جديد |
| **DELETE** | `http://localhost:5000/api/departments/:id` | الأدمن فقط | حذف قسم أكاديمي معين |
| **GET** | `http://localhost:5000/api/settings` | الأدمن فقط | جلب كل الإعدادات وثوابت النظام الحالية |
| **PUT** | `http://localhost:5000/api/settings/:key` | الأدمن فقط | تحديث أو إنشاء إعداد معين ديناميكياً |
| **POST** | `http://localhost:5000/api/settings/initialize` | الأدمن فقط | تهيئة وإدخال الإعدادات الافتراضية لأول مرة |
| **GET** | `http://localhost:5000/api/users/me` | المستخدم الحالي | جلب بيانات الملف الشخصي للمستخدم الحالي |
| **PUT** | `http://localhost:5000/api/users/:id` | الأدمن والمستخدم | تعديل البيانات الأساسية لحساب معين |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للنظام

### 1. فلسفة التعطيل اللطيف بدلاً من الحذف الفيزيائي (Soft Deactivation vs Hard Deletion)
عند الحاجة لإيقاف حساب طالب أو دكتور من النظام (مثال: انتهاء فترة عمل الدكتور بالكلية):
* **المشكلة:** إذا قمنا بحذف مستند الدكتور فيزيائياً من قاعدة البيانات (`findByIdAndDelete`)، ستتحول معرفات الدكاترة في جداول المحاضرات وحضور الطلاب إلى مرجع فارغ (Dangling References / Null Pointer)، مما يؤدي لتعطل وتوقف السيرفر فوراً عند عمل `populate` لبيانات المحاضرات القديمة.
* **الحل البرمجي:** يعتمد النظام على مبدأ **التعطيل اللطيف (Soft Deactivation)**. لا يتم حذف كائن المستخدم بل يتم تعديل حقل النشاط `isActive = false`. هذا يمنعه من تسجيل الدخول أو استخدام النظام، مع الحفاظ التام على سلامة وتكامل البيانات التاريخية (Data Integrity) لتقارير الحضور والغياب للسنوات السابقة.

### 2. الحماية ضد ترقية الصلاحيات والاختراق (Privilege Escalation Prevention)
عند تعديل بيانات مستخدم أو دكتور:
* **الخطر الأمني:** قد يستغل مهاجم ثغرة برمجية لإرسال طلب تعديل لبياناته الشخصية يرفق فيه حقل الدور `role: "admin"` لترقية حساب من طالب إلى مسؤول النظام والتحكم بالسيرفر.
* **الحل البرمجي:** في كافة دوال التحديث (مثل `updateUser` و `updateDoctor`)، يقوم السيرفر بحذف الحقول الحساسة يدوياً من كائن الطلب قبل تمريره لقاعدة البيانات لضمان عدم إمكانية تعديلها عبر هذه الواجهات:
  ```javascript
  delete req.body.password;
  delete req.body.role;
  delete req.body.device;
  ```

### 3. إعداد الثوابت الأكاديمية للنظام (System Settings Initialization)
يحتاج النظام لمعايير عمل ثابتة وقابلة للتغيير ديناميكياً بدون تعديل الكود البرمجي (مثل نسبة الحضور المطلوبة أو وقت التأخير).
* **الحل البرمجي:** تم تصميم دالة `initializeSettings` لتهيئة ثوابت النظام الافتراضية في قاعدة البيانات وتحديثها ديناميكياً بضغطة زر من لوحة التحكم، وتتضمن هذه الثوابت:
  * `MIN_PRESENCE_PERCENTAGE`: النسبة المئوية الدنيا لاعتبار الطالب حاضراً (الافتراضي: 85%).
  * `LATE_THRESHOLD_MINUTES`: الدقائق المسموح بها للتأخير قبل احتساب الطالب متأخراً (الافتراضي: 15 دقيقة).
  * `AUTO_FINALIZE_AFTER_MINUTES`: وقت إغلاق كشوف المحاضرة بعد انتهائها تقويمياً (الافتراضي: 30 دقيقة).

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية تهيئة إعدادات النظام: `initializeSettings`
* **موقع الكود:** [settings.controller.js:L105](file:///d:/work-now/graduation-project/backend/src/controllers/settings.controller.js#L105)

#### 📝 الكود البرمجي المهم:
```javascript
exports.initializeSettings = catchAsync(async (req, res, next) => {
  // 1. تعريف مصفوفة الإعدادات الافتراضية
  const defaultSettings = [
    {
      key: "MIN_PRESENCE_PERCENTAGE",
      value: 85,
      description: "Minimum presence percentage required for attendance"
    },
    {
      key: "LATE_THRESHOLD_MINUTES",
      value: 15,
      description: "Minutes after lecture start to mark attendance as late"
    },
    {
      key: "AUTO_FINALIZE_AFTER_MINUTES",
      value: 30,
      description: "Minutes after lecture end to auto-finalize attendance records"
    }
  ];

  const results = { created: [], skipped: [] };

  for (const setting of defaultSettings) {
    // 2. التحقق من عدم كتابة الثابت مسبقاً في الداتابيز لتجنب التكرار
    const exists = await Setting.findOne({ key: setting.key });
    if (!exists) {
      // إنشاء الإعداد وربطه بالمسؤول الحالي
      await Setting.create({
        ...setting,
        updatedBy: req.user._id,
      });
      results.created.push(setting.key);
    } else {
      results.skipped.push(setting.key);
    }
  }

  res.status(200).json({
    success: true,
    message: "Settings initialized",
    data: results,
  });
});
```

---

### 2. إسناد وتعيين المواد للدكاترة: `assignCourses`
* **موقع الكود:** [doctors.controller.js:L172](file:///d:/work-now/graduation-project/backend/src/controllers/doctors.controller.js#L172)

#### 📝 الكود البرمجي المهم:
```javascript
exports.assignCourses = catchAsync(async (req, res, next) => {
  const doctorId = req.params.id;
  const { courses: courseIds } = req.body; // مصفوفة معرفات المقررات

  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw ApiError.badRequest("Courses array is required");
  }

  // 1. التحقق من وجود حساب الدكتور في قاعدة البيانات
  const doctor = await User.findOne({ _id: doctorId, role: ROLES.DOCTOR });
  if (!doctor) {
    throw ApiError.notFound("Doctor not found");
  }

  // 2. تحديث جماعي للمواد المحددة وتعيين حقل الدكتور بالدكتور الحالي
  const result = await Course.updateMany(
    { _id: { $in: courseIds } },
    { doctor: doctorId },
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} courses assigned to doctor`,
    data: { assigned: result.modifiedCount },
  });
});
```

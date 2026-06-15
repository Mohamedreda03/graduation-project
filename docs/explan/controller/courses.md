# 📚 التوثيق الشامل والمفصل لمتحكم المقررات الدراسية (Courses Controller)

* **اسم الملف الأصلي:** [courses.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/courses.controller.js)
* **المسار البرمجي:** `backend/src/controllers/courses.controller.js`
* **المسؤولية الأساسية:** إدارة المواد الدراسية وتعديلها، وإجراء عمليات تسجيل وإلغاء تسجيل الطلاب في المقررات بطرق مختلفة (يدوياً، جماعياً، أو حسب المستوى الدراسي)، مع ضمان المزامنة المزدوجة لقاعدة البيانات في نفس الوقت لتجنب تعارض البيانات.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/courses` | الأدمن والدكتور | جلب جميع المواد مع الفلترة حسب الفرقة والقسم والدكتور |
| **GET** | `http://localhost:5000/api/courses/:id` | الأدمن والدكتور | جلب بيانات مادة معينة بالتفصيل |
| **POST** | `http://localhost:5000/api/courses` | الأدمن فقط | إنشاء مادة دراسية جديدة بالسيستم |
| **PUT** | `http://localhost:5000/api/courses/:id` | الأدمن فقط | تعديل بيانات مادة دراسية معينة |
| **DELETE** | `http://localhost:5000/api/courses/:id` | الأدمن فقط | إلغاء نشاط وتعطيل مادة دراسية |
| **GET** | `http://localhost:5000/api/courses/:id/students` | الأدمن والدكتور | جلب قائمة الطلاب المسجلين لحضور هذه المادة |
| **POST** | `http://localhost:5000/api/courses/:id/students` | الأدمن فقط | إضافة طلاب معينين للمادة (دوال الاستيراد) |
| **DELETE** | `http://localhost:5000/api/courses/:id/students/:studentId` | الأدمن فقط | حذف طالب معين من تسجيل المادة |
| **GET** | `http://localhost:5000/api/courses/:id/attendance` | الأدمن والدكتور | جلب كشوف حضور الطلاب الخاصة بهذه المادة وتاريخها |
| **GET** | `http://localhost:5000/api/courses/:id/attendance-report` | الأدمن والدكتور | استخراج تقرير حضور تفصيلي ونسب غياب الطلاب بالمادة مرتبة تنازلياً |
| **POST** | `http://localhost:5000/api/courses/:id/enroll` | الأدمن فقط | تسجيل مجموعة من الطلاب في مادة (طريقة الواجهة) |
| **POST** | `http://localhost:5000/api/courses/:id/unenroll` | الأدمن فقط | إلغاء تسجيل مجموعة طلاب من مادة معينة دفعة واحدة |
| **POST** | `http://localhost:5000/api/courses/:id/enroll-by-level` | الأدمن فقط | تسجيل كافة طلاب فرقة دراسية معينة في المادة بضغطة زر |
| **GET** | `http://localhost:5000/api/courses/:id/attendance-stats` | الأدمن والدكتور | جلب إحصائيات ونسبة الحضور العامة للمادة ككل |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للنظام

### 1. مشكلة التزامن المزدوج للبيانات (Bidirectional Database Synchronization)
في قاعدة بيانات MongoDB، إذا قمنا بتسجيل الطلاب بداخل المادة بإضافة معرفاتهم في حقل `students` بداخل مستند المقرر فقط، فسنضطر لعملية بحث بطيئة جداً (Full Table Scan) عند استدعاء جدول الطالب لمعرفة المواد المسجل بها.
* **الحل البرمجي:** يعتمد النظام على التزامن المزدوج في نفس العملية البرمجية:
  1. يتم حفظ معرف الطالب في مصفوفة الطلاب `students` بداخل مستند المادة [Course](file:///d:/work-now/graduation-project/backend/src/models/Course.js).
  2. يتم إضافة معرف المادة في نفس الوقت في مصفوفة المقررات المسجلة `academicInfo.enrolledCourses` بداخل مستند المستخدم [User](file:///d:/work-now/graduation-project/backend/src/models/User.js).
* **ضمان الذرية ومنع التكرار (Atomic Operators):** يتم استخدام المشغل المتقدم `$addToSet` لمنع تكرار المادة في حساب الطالب حتى لو تم الضغط على زر الحفظ عدة مرات بشكل متزامن.

### 2. تسجيل الطلاب بالفرقة الدراسية (Cohort Enrollment)
في بداية الترم الدراسي، يسهل على الإدارة تسجيل فرقة كاملة (مثال: الفرقة الثالثة قسم علوم الحاسب) في مادة اختيارية أو إجبارية دون الحاجة لتحديد أسماء الطلاب فرداً فرداً.
* **الحل البرمجي:** تبحث دالة `enrollByLevel` عن كافة الطلاب الذين ينتمون لنفس الفرقة الممررة وحساباتهم نشطة، ثم تقوم بفلترة الطلاب غير المسجلين بالمادة مسبقاً، وتدفع معرفاتهم دفعة واحدة في مصفوفة المادة وتحدث حسابات الطلاب بالتوازي في عملية واحدة سريعة.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية تسجيل الطلاب بالمقرر (التحديث المزدوج): `addStudentsToCourse`
* **موقع الكود:** [courses.controller.js:L148](file:///d:/work-now/graduation-project/backend/src/controllers/courses.controller.js#L148)

#### 📝 الكود البرمجي المهم:
```javascript
exports.addStudentsToCourse = catchAsync(async (req, res, next) => {
  // استقبال الطلاب من جسم الطلب
  const studentIds = req.body.students || req.body.studentIds;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest("Student IDs array is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // 1. تصفية الطلاب الذين لم يسجلوا بالمادة مسبقاً لمنع التكرار
  const newStudents = studentIds.filter((id) => !course.students.includes(id));
  
  // 2. تحديث مستند المادة ودفع معرفات الطلاب
  course.students.push(...newStudents);
  await course.save();

  // 3. التحديث المزدوج: كتابة معرف المادة في حقل enrolledCourses بداخل حسابات الطلاب المضافة
  await User.updateMany(
    { _id: { $in: newStudents } },
    { $addToSet: { "academicInfo.enrolledCourses": course._id } }, // $addToSet يمنع التكرار نهائياً
  );

  res.status(200).json({
    success: true,
    message: `${newStudents.length} students added to course`,
    data: { addedCount: newStudents.length },
  });
});
```

---

### 2. خوارزمية إلغاء تسجيل الطلاب: `unenrollStudents`
* **موقع الكود:** [courses.controller.js:L335](file:///d:/work-now/graduation-project/backend/src/controllers/courses.controller.js#L335)

#### 📝 الكود البرمجي المهم:
```javascript
exports.unenrollStudents = catchAsync(async (req, res, next) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest("Students array is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // 1. إزالة الطلاب المحددين من مصفوفة المادة عبر التصفية (Filtering)
  course.students = course.students.filter(
    (s) => !students.includes(s.toString()),
  );
  await course.save();

  // 2. التحديث المزدوج: إزالة معرف المادة من حسابات الطلاب المحددين باستخدام المشغل $pull
  await User.updateMany(
    { _id: { $in: students } },
    { $pull: { "academicInfo.enrolledCourses": course._id } }, // $pull يسحب ويمسح القيمة من المصفوفة
  );

  res.status(200).json({
    success: true,
    message: `Students unenrolled from course`,
  });
});
```

---

### 3. خوارزمية تسجيل فرقة دراسية بالكامل: `enrollByLevel`
* **موقع الكود:** [courses.controller.js:L367](file:///d:/work-now/graduation-project/backend/src/controllers/courses.controller.js#L367)

#### 📝 الكود البرمجي المهم:
```javascript
exports.enrollByLevel = catchAsync(async (req, res, next) => {
  const { level } = req.body;

  if (!level) {
    throw ApiError.badRequest("Level is required");
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    throw ApiError.notFound("Course not found");
  }

  // 1. جلب كافة مستخدمين النظام الذين ينتمون لهذه الفرقة وحساباتهم نشطة
  const studentsAtLevel = await User.find({
    role: ROLES.STUDENT,
    "academicInfo.level": parseInt(level),
    isActive: true,
  }).select("_id");

  const studentIds = studentsAtLevel.map((s) => s._id);
  
  // 2. تصفية الطلاب غير المسجلين مسبقاً بالمادة
  const newStudents = studentIds.filter(
    (id) => !course.students.some((s) => s.toString() === id.toString()),
  );

  // 3. دفع الطلاب وتحديث كائن المادة
  course.students.push(...newStudents);
  await course.save();

  // 4. تحديث حسابات جميع الطلاب بالتوازي
  await User.updateMany(
    { _id: { $in: newStudents } },
    { $addToSet: { "academicInfo.enrolledCourses": course._id } },
  );

  res.status(200).json({
    success: true,
    data: { enrolled: newStudents.length },
  });
});
```

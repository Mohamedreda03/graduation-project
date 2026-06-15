# 👨‍🎓 التوثيق الشامل والمفصل لمتحكم الطلاب (Students Controller)

* **اسم الملف الأصلي:** [students.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/students.controller.js)
* **المسار البرمجي:** `backend/src/controllers/students.controller.js`
* **المسؤولية الأساسية:** إدارة شئون الطلاب، استخراج الإحصائيات الأكاديمية حسب المستويات الدراسية، معالجة استيراد الطلاب دفعة واحدة (Bulk Import)، وإدارة دورة حياة طلبات استبدال الهواتف المحمولة والموافقة عليها.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/students/stats` | الأدمن فقط (`Bearer Token`) | جلب إحصائيات عامة عن أعداد الطلاب والمستويات |
| **GET** | `http://localhost:5000/api/students` | الأدمن والدكتور | جلب كافة الطلاب مع البحث والفلترة حسب القسم والمستوى |
| **GET** | `http://localhost:5000/api/students/:id` | الأدمن والدكتور | جلب الملف الشخصي المفصل لطالب معين ومواده |
| **POST** | `http://localhost:5000/api/students` | الأدمن فقط | إنشاء حساب طالب جديد يدوياً |
| **POST** | `http://localhost:5000/api/students/bulk` | الأدمن فقط | إنشاء حسابات مجموعة من الطلاب دفعة واحدة (استيراد) |
| **PUT** | `http://localhost:5000/api/students/:id` | الأدمن فقط | تعديل بيانات طالب معين (مع حظر تعديل الصلاحيات) |
| **GET** | `http://localhost:5000/api/students/:id/attendance` | الأدمن والدكتور | جلب سجل حضور طالب معين مع الفلترة حسب المادة والتاريخ |
| **GET** | `http://localhost:5000/api/students/:id/attendance-summary` | الأدمن والدكتور | ملخص نسب حضور طالب معين مقسمة لكل مقرر دراسي |
| **GET** | `http://localhost:5000/api/students/my-device` | الطالب فقط | جلب معلومات الهاتف المسجل للطالب الحالي وطلباته |
| **POST** | `http://localhost:5000/api/students/request-device-change` | الطالب فقط | تقديم طلب استبدال ماك الهاتف عند شراء جهاز جديد |
| **GET** | `http://localhost:5000/api/students/device-requests` | الأدمن فقط | جلب كافة طلبات استبدال الهواتف المعلقة والمقضية |
| **POST** | `http://localhost:5000/api/students/device-requests/:id/approve` | الأدمن فقط | الموافقة على طلب استبدال الهاتف للطالب |
| **POST** | `http://localhost:5000/api/students/device-requests/:id/reject` | الأدمن فقط | رفض طلب استبدال الهاتف مع ذكر سبب الرفض |

---

## 🧠 التصميم المنطقي والحلول البرمجية للمشكلات الفنية

### 1. مرونة استيراد الطلاب دفعة واحدة (Robust Bulk Import)
عند رفع كشف طلاب يحتوي على مئات الصفوف، قد يحتوي الكشف على أخطاء بشرية مثل تكرار بريد إلكتروني أو رقم أكاديمي لطالب مسجل مسبقاً.
* **المشكلة:** إذا تم استخدام الإدخال الجماعي الافتراضي (`insertMany`)، سيؤدي حدوث خطأ في سطر واحد إلى إلغاء معالجة الملف بأكمله وتوقف عملية التسجيل.
* **الحل البرمجي:** يعتمد النظام على خوارزمية المعالجة الفردية الآمنة داخل حلقة تكرار (`Loop`) محمية بـ `try-catch`. يقوم السيرفر بمعالجة كل طالب على حدة؛ الطالب السليم يُضاف لمصفوفة المقبولين، والطالب الذي يحتوي على خطأ (تكرار إيميل مثلاً) يُضاف لمصفوفة المرفوضين مع إرفاق نص الخطأ بوضوح. في النهاية، يُرجع السيرفر تقريراً كاملاً ومفصلاً للأدمن يوضح المقبولين والمرفوضين وأسباب الرفض لتمكينه من تعديل الكشف وإعادة رفعه.

### 2. الحفاظ على أمن الحضور عند تبديل الأجهزة
استبدال هاتف الطالب عملية حساسة؛ لأن ربط ماك أدريس جديد قد يُستغل لتسجيل حضور وهمي.
* **الحل البرمجي:** يمر طلب استبدال الجهاز بدورة حياة ثلاثية الحالات: `pending` ──► `approved` أو `rejected`. 
  عند موافقة الأدمن (`approveDeviceChange`):
  * يتم مسح بيانات الهاتف القديم تماماً.
  * يتم نسخ معلومات الجهاز الجديد المكتوبة في طلب التغيير المؤقت إلى حقل الجهاز الفعلي للـ User.
  * يتم تعيين `isVerified: true`.
  * يتم إلغاء الجلسات النشطة لتأمين الحساب وإجبار التطبيق على قراءة الماك الجديد من الهاتف المعتمد الجديد فقط.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية الإدخال الجماعي للطلاب: `createStudentsBulk`
* **موقع الكود:** [students.controller.js:L123](file:///d:/work-now/graduation-project/backend/src/controllers/students.controller.js#L123)

#### 📝 الكود البرمجي المهم:
```javascript
exports.createStudentsBulk = catchAsync(async (req, res, next) => {
  const { students } = req.body;

  if (!Array.isArray(students) || students.length === 0) {
    throw ApiError.badRequest("Students array is required");
  }

  // كائن لتجميع نتائج المعالجة
  const results = {
    success: [],
    failed: [],
  };

  for (const studentData of students) {
    try {
      // إجبار دور المستخدم ليكون طالباً دائماً
      const student = await User.create({
        ...studentData,
        role: ROLES.STUDENT,
      });
      // إضافة الطلاب الذين تم إنشاؤهم بنجاح
      results.success.push({
        studentId: student.studentId,
        name: student.fullName,
      });
    } catch (error) {
      // التقاط أي خطأ (تكرار بريد، بيانات ناقصة) وإضافته لتقرير الفشل دون توقيف الـ Loop
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
```

---

### 2. الموافقة على تغيير الهاتف وتحديث الماك: `approveDeviceChange`
* **موقع الكود:** [students.controller.js:L375](file:///d:/work-now/graduation-project/backend/src/controllers/students.controller.js#L375)

#### 📝 الكود البرمجي المهم:
```javascript
exports.approveDeviceChange = catchAsync(async (req, res, next) => {
  // 1. البحث عن الطالب في قاعدة البيانات
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  // التأكد من وجود طلب مسجل وقيد المراجعة بالفعل
  if (!user.deviceChangeRequest?.requested) {
    throw ApiError.badRequest("No device change request found");
  }

  // 2. ترقية ونقل بيانات الماك أدريس الجديد ليكون الهاتف المعتمد للحساب
  user.device = {
    ...user.deviceChangeRequest.newDeviceInfo,
    registeredAt: new Date(),
    isVerified: true, // جعل الجهاز نشط ومفعل للحضور
  };

  // 3. إنهاء حالة طلب التغيير وتحديث حالته لـ APPROVED
  user.deviceChangeRequest = {
    requested: false,
    status: DEVICE_REQUEST_STATUS.APPROVED,
  };

  // 4. حفظ البيانات في الداتابيز
  await user.save();

  res.status(200).json({
    success: true,
    message: "Device change approved successfully",
  });
});
```

---

### 3. إحصائيات الطلاب حسب المستويات: `getStudentStats`
* **موقع الكود:** [students.controller.js:L10](file:///d:/work-now/graduation-project/backend/src/controllers/students.controller.js#L10)

#### 📝 الكود البرمجي المهم:
```javascript
exports.getStudentStats = catchAsync(async (req, res, next) => {
  // حساب إجمالي الطلاب بالنظام
  const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });

  // تجميع وحساب أعداد الطلاب لكل مستوى دراسي عبر الـ Aggregation Pipeline
  const levelStats = await User.aggregate([
    { $match: { role: ROLES.STUDENT } }, // الطلاب فقط
    {
      $group: {
        _id: "$academicInfo.level", // التجميع برقم المستوى
        count: { $sum: 1 }, // حساب الأعداد
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // تنسيق المخرجات وتعبئة المستويات الدراسية الفارغة بـ 0 تلقائياً
  const levelCounts = {};
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
```

# 🏫 التوثيق الشامل والمفصل لمتحكم القاعات ونقاط الوصول (Halls Controller)

* **اسم الملف الأصلي:** [halls.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/halls.controller.js)
* **المسار البرمجي:** `backend/src/controllers/halls.controller.js`
* **المسؤولية الأساسية:** إدارة القاعات والمدرجات الدراسية، وإعداد نقاط الوصول (Access Points) لكل قاعة وتحديد نطاقات الـ IP الخاصة بها، وتوليد وتجديد مفاتيح التوثيق المشفرة (API Keys) لضمان أمن الاتصال الفعلي مع سكريبتات نقاط الوصول.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **GET** | `http://localhost:5000/api/halls` | الأدمن والدكتور | جلب كافة القاعات الدراسية في الجامعة مرتبة بالاسم |
| **GET** | `http://localhost:5000/api/halls/:id` | الأدمن والدكتور | جلب بيانات قاعة معينة بالتفصيل |
| **POST** | `http://localhost:5000/api/halls` | الأدمن فقط | إنشاء قاعة جديدة وتوليد مفتاح أمان لشبكتها تلقائياً |
| **PUT** | `http://localhost:5000/api/halls/:id` | الأدمن فقط | تعديل البيانات الأساسية للقاعة (مثل الاسم والمبنى والسعة) |
| **DELETE** | `http://localhost:5000/api/halls/:id` | الأدمن فقط | حذف قاعة من النظام بشكل كامل |
| **PUT** | `http://localhost:5000/api/halls/:id/access-point` | الأدمن فقط | تعديل إعدادات الـ Wi-Fi للقاعة أو تجديد مفتاح الأمان |
| **GET** | `http://localhost:5000/api/halls/:id/status` | الأدمن والدكتور | جلب حالة اتصال نقطة الوصول بالإنترنت ووقت آخر ظهور |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للنظام

### 1. تأمين قنوات اتصال الشبكة بالتشفير العشوائي (AP Cryptographic Keys)
تتلقى خوادم النظام إشارات تسجيل الحضور من أجهزة خارجية متصلة بالشبكة المحلية.
* **الخطر الأمني:** إذا لم تكن قنوات الاتصال مؤمنة، يمكن لأي طالب يملك معرفة برمجية بسيطة إرسال طلبات وهمية لخادم الباك-إند لتسجيل حضوره أو حضور أصدقائه دون الحاجة للتواجد بالقاعة.
* **الحل البرمجي:** عند إنشاء أي قاعة جديدة بالنظام، يستدعي السيرفر مكتبة التشفير الأساسية في Node.js وهي `crypto` لتوليد مفتاح أمان عشوائي قوي ومعقد جداً بطول 32 بايت وتحويله لسلسلة سداسية عشرية (Hexadecimal):
  ```javascript
  const apiKey = crypto.randomBytes(32).toString("hex");
  ```
  هذا المفتاح يُعطى لسكريبت نقطة الوصول [access_point.py](file:///d:/work-now/graduation-project/access_point.py) ويتم إرساله كـ Header `X-API-Key` في كل طلب للتحقق من هوية القاعة قبل معالجة الحضور.

### 2. الحفاظ على سرية مفاتيح الأمان في قاعدة البيانات
* **الخطر الأمني:** عند طلب جلب بيانات القاعات لعرضها في لوحات التحكم للمستخدمين، قد يؤدي إرسال مفاتيح الـ API Keys في الاستجابة (JSON Response) إلى تسريبها.
* **الحل البرمجي:** تم تهيئة موديل [Hall](file:///d:/work-now/graduation-project/backend/src/models/Hall.js) ليقوم برمجياً بحذف حقل `apiKey` تلقائياً من كائن الاستجابة أثناء تحويل البيانات لـ JSON عبر خاصية الـ `transform` في Mongoose، مما يضمن ظهور مفتاح الأمان للأدمن فقط عند التوليد لأول مرة أو التجديد.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. خوارزمية إنشاء قاعة وتوليد مفتاح التوثيق: `createHall`
* **موقع الكود:** [halls.controller.js:L41](file:///d:/work-now/graduation-project/backend/src/controllers/halls.controller.js#L41)

#### 📝 الكود البرمجي المهم:
```javascript
exports.createHall = catchAsync(async (req, res, next) => {
  // 1. توليد مفتاح أمان عشوائي ومحمي ومقاوم للتخمين بطول 64 حرفاً سداسياً عشرياً
  const apiKey = crypto.randomBytes(32).toString("hex");

  // 2. دمج مفتاح الأمان مع البيانات القادمة من الـ Request Body
  const hallData = {
    ...req.body,
    accessPoint: {
      ...req.body.accessPoint,
      apiKey, // ربط المفتاح بالشبكة الخاصة بالقاعة
    },
  };

  // 3. كتابة القاعة الجديدة بقاعدة البيانات
  const hall = await Hall.create(hallData);

  res.status(201).json({
    success: true,
    data: hall,
  });
});
```

---

### 2. تعديل بيانات شبكة الواي فاي وتجديد المفتاح: `updateAccessPoint`
* **موقع الكود:** [halls.controller.js:L105](file:///d:/work-now/graduation-project/backend/src/controllers/halls.controller.js#L105)

#### 📝 الكود البرمجي المهم:
```javascript
exports.updateAccessPoint = catchAsync(async (req, res, next) => {
  const { ssid, ipRange, apIdentifier, regenerateKey } = req.body;

  const hall = await Hall.findById(req.params.id);
  if (!hall) {
    throw ApiError.notFound("Hall not found");
  }

  // تحديث بيانات نقطة الوصول الاختيارية إن وجدت في الطلب
  if (ssid) hall.accessPoint.ssid = ssid;
  if (ipRange) hall.accessPoint.ipRange = ipRange;
  if (apIdentifier) hall.accessPoint.apIdentifier = apIdentifier;

  // خيار لتجديد مفتاح الأمان وإلغاء صلاحية المفتاح القديم فوراً في حال تسريبه
  if (regenerateKey) {
    hall.accessPoint.apiKey = crypto.randomBytes(32).toString("hex");
  }

  await hall.save();

  res.status(200).json({
    success: true,
    data: hall,
  });
});
```

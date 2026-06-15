# 🔐 التوثيق الشامل والمفصل لمتحكم الحماية والتوثيق (Auth Controller)

* **اسم الملف الأصلي:** [auth.controller.js](file:///d:/work-now/graduation-project/backend/src/controllers/auth.controller.js)
* **المسار البرمجي:** `backend/src/controllers/auth.controller.js`
* **المسؤولية الأساسية:** إدارة عمليات مصادقة المستخدمين (الدكاترة، الأدمن، الطلاب)، وإصدار وتجديد الـ Access و Refresh Tokens، وتأمين النظام ضد الاختراق، والتحكم في ربط الأجهزة (Device Binding) للطلاب.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **POST** | `http://localhost:5000/api/auth/web/login` | عام | تسجيل دخول الدكاترة والأدمن (عبر ملفات الكوكيز) |
| **POST** | `http://localhost:5000/api/auth/web/refresh` | عام (يقرأ الكوكي) | تجديد صلاحية التوكن للويب تلقائياً |
| **POST** | `http://localhost:5000/api/auth/web/logout` | عام (يقرأ الكوكي) | تسجيل خروج مستخدمي الويب وحذف الكوكيز |
| **POST** | `http://localhost:5000/api/auth/mobile/login` | عام | تسجيل دخول الطالب من الموبايل (يرجع التوكنز في Body) |
| **POST** | `http://localhost:5000/api/auth/mobile/refresh` | عام (يستقبل التوكن في Body) | تجديد صلاحية التوكن لتطبيق الموبايل |
| **POST** | `http://localhost:5000/api/auth/mobile/logout` | عام (يستقبل التوكن في Body) | تسجيل خروج الطالب وحذف الـ Refresh Token |
| **POST** | `http://localhost:5000/api/auth/change-password` | المستخدم المسجل | تغيير كلمة المرور وإلغاء صلاحية كافة الأجهزة الأخرى |

---

## 🧠 التصميم المنطقي والقرارات الهندسية للنظام

### 1. الويب مقابل الموبايل (Web Cookies vs Mobile Tokens)
تختلف البيئة الأمنية للويب عن الهواتف المحمولة بشكل كبير، لذا تم تصميم نظام توثيق مزدوج:
* **بوابة الويب (الدكاترة والأدمن):** يتم تخزين التوكنز في **httpOnly Cookies**. هذا يعني أن المتصفح لا يستطيع قراءة التوكن برمجياً عبر الـ JavaScript، مما يحمي النظام بالكامل من هجمات سرقة التوكنز الشهيرة (Cross-Site Scripting - XSS). كما تم ضبط خيار `sameSite: "lax"` لمنع هجمات تزوير الطلبات عبر المواقع (CSRF).
* **تطبيق الموبايل (الطلاب):** ترجع التوكنز مباشرة في جسم الاستجابة (JSON Response Body). تطبيقات الموبايل تعمل في بيئة معزولة (Sandboxed) وآمنة، وتستطيع تخزين التوكنز في مخازن آمنة مثل **iOS Keychain** أو **Android Keystore** دون القلق من هجمات الويب، كما أن بعض مكتبات الموبايل تواجه صعوبة في التعامل مع ملفات الكوكيز التلقائية.

### 2. خوارزمية ربط جهاز الطالب (Device Binding Mechanism)
لمنع تزوير حضور الطلاب (بأن يقوم طالب بتسجيل الدخول من جهاز زميله ليحضر نيابة عنه)، تم تصميم خوارزمية صارمة لربط الحساب بجهاز فيزيائي واحد:
1. **التحقق من الماك أدريس (MAC Address):** الماك أدريس هو البصمة الفيزيائية الحقيقية لكارت الشبكة في هاتف الطالب، وهو نفسه الذي تلتقطه نقطة الوصول (AP).
2. **المعرف الفريد المولد من السيرفر (Server-Generated deviceId):** لا نثق بالمعرفات التي يرسلها الموبايل تلقائياً، بل يقوم السيرفر بتوليد معرف عشوائي فريد (UUID) وحفظه مع الماك أدريس المعتمد.
3. **الدخول الأول (First Login):** يتم أخذ الماك أدريس المبعوث وتخزينه كـ "جهاز الطالب المعتمد" وتفعيله تلقائياً.
4. **محاولة الدخول من جهاز آخر:** إذا حاول الطالب تسجيل الدخول من هاتف بـ MAC Address مختلف، يكتشف السيرفر عدم التطابق ويرفض الطلب فوراً برمز الخطأ `403 Forbidden` لمنع الحضور بالنيابة.

### 3. أمن التوكنز وجلسات العمل المتعددة (Global Session Revocation)
* **دوران التوكنز (Token Rotation):** عند طلب تجديد الصلاحية (Refresh)، لا يكتفي السيرفر بإعطاء توكن جديد فقط، بل يقوم بمسح الـ Refresh Token القديم من جدول [RefreshToken](file:///d:/work-now/graduation-project/backend/src/models/RefreshToken.js) وكتابة التوكن الجديد، لمنع إعادة استخدام التوكنز المسروقة.
* **إلغاء صلاحية الجلسات:** عند قيام المستخدم بتغيير كلمة المرور الخاصة به، يتم استدعاء ميثود `RefreshToken.removeAllForUser` لمسح كل توكنز التجديد الخاصة به في قاعدة البيانات فوراً. هذا يؤدي لتسجيل الخروج التلقائي الفوري من كافة الأجهزة التي كانت متصلة بالحساب في نفس الوقت كإجراء أمني رادع.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. تسجيل دخول مستخدمي الويب: `webLogin`
* **موقع الكود:** [auth.controller.js:L73](file:///d:/work-now/graduation-project/backend/src/controllers/auth.controller.js#L73)

#### 📝 الكود البرمجي المهم:
```javascript
exports.webLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. البحث عن المستخدم وإجبار السيرفر على جلب كلمة المرور المخفية افتراضياً
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  // 2. التحقق من صلاحية دور المستخدم لدخول الويب
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.DOCTOR) {
    throw ApiError.forbidden("هذه الصفحة متاحة فقط للمسؤولين والدكاترة");
  }

  // 3. التحقق من تطابق كلمة المرور عبر الهاش
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
  }

  // 4. توليد التوكنز
  const { accessToken, refreshToken } = generateTokens(user._id);

  // 5. حفظ الـ Refresh Token في الداتابيز لتتبع الجلسة
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: refreshExpiry,
  });

  // 6. تعيين التوكنز في كوكيز httpOnly آمنة
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  res.status(200).json({
    success: true,
    data: { user: prepareUserData(user) },
  });
});
```

---

### 2. تسجيل دخول الموبايل للطلاب والتحقق من الأجهزة: `mobileLogin`
* **موقع الكود:** [auth.controller.js:L135](file:///d:/work-now/graduation-project/backend/src/controllers/auth.controller.js#L135)

#### 📝 الكود البرمجي المهم:
```javascript
exports.mobileLogin = catchAsync(async (req, res, next) => {
  const { email, studentId, password, deviceInfo } = req.body;

  // 1. البحث بالرقم الأكاديمي أو البريد
  const query = email ? { email } : { studentId };
  const user = await User.findOne(query).select("+password");
  if (!user) {
    throw ApiError.unauthorized("بيانات الدخول غير صحيحة");
  }

  // 2. حماية البوابة ومنع الطالب من استخدام واجهات الويب
  if (user.role !== ROLES.STUDENT) {
    throw ApiError.forbidden("تطبيق الموبايل متاح للطلاب فقط");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("بيانات الدخول غير صحيحة");
  }

  // 3. منطق خوارزمية ربط جهاز الطالب (Device Binding)
  if (deviceInfo && deviceInfo.macAddress) {
    if (!user.device || !user.device.isVerified) {
      // الحالة أ: الطالب يسجل دخوله لأول مرة بالنظام
      // يتم ربط ماك الهاتف بجهازه وتوليد UUID فريد كـ deviceId
      user.device = {
        deviceId: uuidv4(),
        macAddress: deviceInfo.macAddress,
        registeredAt: new Date(),
        isVerified: true,
      };
    } else if (user.device.macAddress === deviceInfo.macAddress) {
      // الحالة ب: الدخول من نفس الهاتف المعتمد (سليم)
    } else {
      // الحالة ج: محاولة الدخول من ماك أدريس مختلف (حظر فوري)
      throw ApiError.forbidden(
        "هذا الحساب مسجل على جهاز آخر. يرجى استخدام الجهاز المسجل أو طلب تغيير الجهاز.",
      );
    }
  }

  user.lastLogin = new Date();
  await user.save();

  // 4. توليد وإرجاع التوكنز في الـ JSON Body وتخزين الـ Refresh Token
  const { accessToken, refreshToken } = generateTokens(user._id);
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    deviceId: deviceInfo?.deviceId,
    expiresAt: refreshExpiry,
  });

  res.status(200).json({
    success: true,
    data: {
      user: prepareUserData(user),
      accessToken,
      refreshToken,
    },
  });
});
```

---

### 3. تغيير كلمة المرور وإلغاء الجلسات: `changePassword`
* **موقع الكود:** [auth.controller.js:L589](file:///d:/work-now/graduation-project/backend/src/controllers/auth.controller.js#L589)

#### 📝 الكود البرمجي المهم:
```javascript
exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  // 1. التحقق من كلمة المرور الحالية للمستخدم
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  // 2. تحديث كلمة المرور (يتم تشفيرها تلقائياً بالـ Pre-save Hook)
  user.password = newPassword;
  await user.save();

  // 3. الخطوة الأمنية الهامة: طرد كافة الأجهزة المتصلة
  await RefreshToken.removeAllForUser(user._id);

  // 4. توليد وإرجاع كوكيز أو توكنز جديدة للجهاز الحالي فقط المستخدم لتغيير الباسورد
  const tokens = generateTokens(user._id);
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);
  await RefreshToken.create({
    token: tokens.refreshToken,
    user: user._id,
    expiresAt: refreshExpiry,
  });

  if (isWebClient(req)) {
    // إرجاع كوكيز ويب جديدة
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.cookie("accessToken", tokens.accessToken, getAccessTokenCookieOptions());
    res.cookie("refreshToken", tokens.refreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } else {
    // إرجاع توكنز موبايل في جسم الاستجابة
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: tokens,
    });
  }
});
```

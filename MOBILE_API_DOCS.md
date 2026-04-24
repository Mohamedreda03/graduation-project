# 📱 توثيق API الموبايل (Mobile API Documentation)

## نظام الحضور الذكي - تطبيق الطالب

> **رابط السيرفر الأساسي (Base URL):** `http://<SERVER_IP>:5000/api`
> **جميع الطلبات المحمية تتطلب:** `Authorization: Bearer <accessToken>`

---

## 🗺️ كيف يعمل النظام (هام جداً!)

```
1. الطالب يفتح التطبيق لأول مرة.
2. الطالب يسجل الدخول ← التطبيق يرسل الـ MAC Address الحقيقي للجهاز.
3. السيرفر (Backend) يولد معرف فريد للجهاز (deviceId - UUID) ويربطه بالـ MAC Address.
4. السيرفر يرجع الـ deviceId ← التطبيق يقوم بحفظه محلياً (Cache).
5. عندما يصل الطالب إلى قاعة المحاضرات:
   - هاتفه يتصل بشبكة الواي فاي (WiFi) الخاصة بالقاعة.
   - نقطة الوصول (Access Point) تلتقط الماك أدريس (MAC Address).
   - السيرفر يطابق الماك أدريس ← يسجل الحضور تلقائياً ✅.
6. إذا قام الطالب بمسح التطبيق وإعادة تثبيته ← يرسل نفس الـ MAC Address ← السيرفر يعرفه.
7. الطالب يفتح التطبيق لعرض سجلات حضوره وغيابه.
```

> ⚠️ **هام:** يجب إرسال الـ `macAddress` أثناء عملية تسجيل الدخول. هذه هي الطريقة التي يتعرف بها السيرفر على الجهاز. الـ `deviceId` **يتم توليده بواسطة السيرفر** وليس التطبيق.

---

## 🔐 المصادقة (Authentication)

### 1. تسجيل الدخول (Login)

`POST /auth/mobile/login`

**لا يتطلب مصادقة مسبقة**

**جسم الطلب (Request Body):**

```json
{
  "studentId": "20210001",
  "password": "student123",
  "deviceInfo": {
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "deviceName": "Samsung Galaxy S21"
  }
}
```

> ℹ️ يمكنك تسجيل الدخول باستخدام البريد الإلكتروني `email` أو الرقم الأكاديمي `studentId`.
> ⚠️ حقل الـ `macAddress` **إلزامي**. حقل الـ `deviceName` اختياري ولكن يفضل إرساله.
> ❌ لا ترسل `deviceId` - السيرفر هو من يقوم بتوليده.

**استجابة النجاح (Success Response - 200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Ahmed Mohamed",
      "email": "ahmed@student.edu",
      "studentId": "20210001",
      "role": "student",
      "device": {
        "deviceId": "550e8400-e29b-41d4-a716-446655440000",
        "macAddress": "AA:BB:CC:DD:EE:FF",
        "deviceName": "Samsung Galaxy S21",
        "isVerified": true
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> 💾 **ملاحظة:** قم بتخزين `accessToken` و `refreshToken` وأيضاً الـ `deviceId` (المستخرج من `user.device.deviceId`) في مخزن بيانات آمن (Secure Storage).
> الـ `deviceId` يتم توليده من السيرفر وسيكون **نفسه** حتى بعد إعادة تثبيت التطبيق (طالما أن الـ MAC Address متطابق).

---

### 2. تحديث التوكن (Refresh Token)

`POST /auth/mobile/refresh`

**جسم الطلب (Request Body):**

```json
{
  "refreshToken": "<stored_refreshToken>"
}
```

**استجابة النجاح (Success Response - 200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..."
  }
}
```

---

### 3. تسجيل الخروج (Logout)

`POST /auth/mobile/logout`

**يتطلب مصادقة مسبقة**

**جسم الطلب (Request Body):**

```json
{
  "refreshToken": "<stored_refreshToken>"
}
```

---

## 📊 الحضور والغياب (Attendance)

### 4. عرض سجلات حضوري (الكل)

`GET /attendance/my`

**يتطلب مصادقة (للطلاب فقط)**

**معاملات الاستعلام (Query Parameters):**

| المعامل     | النوع     | الوصف                        | الافتراضي |
| :---------- | :-------- | :--------------------------- | :-------- |
| `startDate` | `date`    | تصفية من تاريخ (YYYY-MM-DD)  | -         |
| `endDate`   | `date`    | تصفية إلى تاريخ (YYYY-MM-DD) | -         |
| `page`      | `integer` | رقم الصفحة                   | 1         |
| `limit`     | `integer` | عدد السجلات في الصفحة        | 20        |

---

### 5. عرض حضوري لمقرر معين

`GET /attendance/my/course/:courseId`

**يتطلب مصادقة (للطلاب فقط)**

---

### 6. حالة المحاضرة الحالية (Polling) 🆕

`GET /attendance/my/status`

**يتطلب مصادقة (للطلاب فقط)**

> 🔄 **الغرض:** هذا الـ endpoint مخصص للاستخدام المتكرر (Polling) من تطبيق Flutter كل 30-60 ثانية لمعرفة هل الطالب حالياً داخل محاضرة ولا لأ.

**استجابة النجاح - الطالب في محاضرة (200):**

```json
{
  "success": true,
  "data": {
    "inLecture": true,
    "session": {
      "hallName": "قاعة 301",
      "courseName": "مقدمة في البرمجة",
      "courseCode": "CS101",
      "doctorName": "أحمد محمد",
      "startTime": "09:00",
      "endTime": "10:30",
      "connectedAt": "2026-02-22T09:05:00.000Z",
      "attendanceStatus": "in-progress",
      "presenceTimeMinutes": 25
    }
  }
}
```

**استجابة النجاح - الطالب مش في محاضرة (200):**

```json
{
  "success": true,
  "data": {
    "inLecture": false,
    "session": null
  }
}
```

> 💡 **نصيحة Flutter:** استخدم `Timer.periodic` كل 30 ثانية لعمل polling. لو `inLecture == true` اعرض بيانات المحاضرة، غير كده اعرض شاشة "مش في محاضرة".
> ⚡ **ملاحظة أداء:** الـ endpoint خفيف جداً (query واحد على `StudentSession`) فمفيش مشكلة في الـ polling المتكرر.

---

**قيم حالات الحضور (Attendance Status):**

| الحالة        | المعنى                    |
| :------------ | :------------------------ |
| `present`     | الطالب حاضر ✅            |
| `absent`      | الطالب غائب ❌            |
| `excused`     | غياب بعذر 📄              |
| `in-progress` | المحاضرة لا تزال جارية 🔄 |

---

## 📚 المقررات الدراسية (Courses)

### 6. عرض كل المقررات

`GET /courses`

**يتطلب مصادقة**

---

## 👤 الملف الشخصي (Student Profile)

### 8. عرض بيانات جهازي

`GET /students/my-device`

**يتطلب مصادقة (للطلاب فقط)**

---

### 9. طلب تغيير الجهاز

`POST /students/request-device-change`

**يتطلب مصادقة (للطلاب فقط)**

> يستخدم هذا الطلب إذا قام الطالب بشراء هاتف جديد ويحتاج لتسجيله.

**جسم الطلب (Request Body):**

```json
{
  "reason": "فقدت هاتفي القديم واشتريت هاتف جديد",
  "newDeviceInfo": {
    "macAddress": "BB:CC:DD:EE:FF:00",
    "deviceName": "Samsung Galaxy S24"
  }
}
```

---

## 📱 التعرف على الجهاز بالـ MAC Address - دليل كامل

### ما هو الـ MAC Address؟

الـ MAC Address هو **عنوان فريد** لكل كارت شبكة (WiFi adapter) في الجهاز. يتميز بـ:

- ✅ **ثابت لكل جهاز** - كل هاتف له MAC Address مختلف
- ✅ **لا يتغير بمسح التطبيق أو عمل Factory Reset**
- ✅ **نفسه الذي تراه نقطة الوصول (Access Point)** عند الاتصال بالشبكة
- ✅ **يمكن الحصول عليه من إعدادات الشبكة** في Flutter

---

### 📱 جهة تطبيق الموبايل: كيف تحصل على الـ MAC Address

#### الخطوة 1: الحصول على الـ MAC Address الحقيقي

الـ MAC Address الحقيقي يمكن الحصول عليه من **إعدادات الشبكة** (Network Info).

> 💡 **ملاحظة:** يجب أن يكون الجهاز متصل بشبكة WiFi للحصول على الـ MAC Address الحقيقي.

#### الخطوة 2: الإرسال عند تسجيل الدخول

```dart
Future<void> login(String studentId, String password) async {
  final macAddress = await getMacAddress(); // من إعدادات الشبكة

  final response = await http.post(
    Uri.parse('$baseUrl/auth/mobile/login'),
    body: jsonEncode({
      'studentId': studentId,
      'password': password,
      'deviceInfo': {
        'macAddress': macAddress,        // ⚠️ إلزامي
        'deviceName': await _getDeviceName(), // اختياري
      },
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body)['data'];

    // حفظ الـ deviceId المرسل من السيرفر
    final deviceId = data['user']['device']['deviceId'];
    await secureStorage.write(key: 'deviceId', value: deviceId);

    // حفظ التوكنز
    await secureStorage.write(key: 'accessToken', value: data['accessToken']);
    await secureStorage.write(key: 'refreshToken', value: data['refreshToken']);
  }
}
```

---

### 🖥️ جهة السيرفر: كيف يتم استخدام الـ MAC Address

يستخدم السيرفر الـ MAC Address في **3 سيناريوهات**:

#### السيناريو 1: أول تسجيل دخول (طالب جديد)

- يرسل الموبايل الـ MAC Address.
- السيرفر يكتشف أنه ليس للطالب جهاز مسجل مسبقاً.
- يولد السيرفر معرف جديد (UUID) ويحفظه مع الـ MAC Address ويرجع المعرف للموبايل.

#### السيناريو 2: نفس الجهاز بعد مسح التطبيق وإعادة تثبيته

- يرسل الموبايل نفس الـ MAC Address (لأن الـ MAC لا يتغير).
- السيرفر يجد الـ MAC مطابق للجهاز المحفوظ مسبقاً.
- السيرفر يرجع **نفس** الـ `deviceId` القديم للطالب.

#### السيناريو 3: محاولة استخدام جهاز مختلف (تزوير)

- يرسل الموبايل MAC Address مختلف.
- السيرفر يجد الـ MAC لا يطابق الجهاز المسجل لهذا الطالب.
- السيرفر يرفض الطلب ويرجع خطأ **403 Forbidden**.

---

### 🔄 مخطط دورة الحياة الكاملة

```
┌─────────────────────────────────────────────────────────┐
│                    تطبيق الموبايل                        │
│                                                          │
│  1. الحصول على MAC Address الحقيقي من إعدادات الشبكة     │
│  2. إرسال الـ MAC Address في طلب تسجيل الدخول            │
│  3. استلام الـ deviceId من السيرفر وحفظه في SecureStorage │
│  4. عند إعادة التثبيت: MAC مطابق ← يرجع نفس الـ ID      │
│  5. هاتف جديد: MAC مختلف ← يطلب الطالب تغيير الجهاز     │
└───────────────────────┬─────────────────────────────────┘
                        │ POST /auth/mobile/login
                        │ { macAddress: "AA:BB:CC:DD:EE:FF" }
                        ↓
┌─────────────────────────────────────────────────────────┐
│                     السيرفر (Backend)                    │
│                                                          │
│  1. استلام الـ MAC Address من التطبيق                     │
│  2. التحقق: هل للطالب جهاز مسجل؟                         │
│     ├─ لا  ← توليد UUID كـ deviceId                      │
│     │        حفظ { deviceId, macAddress } في الموديل      │
│     ├─ نعم، نفس الـ MAC ← إرجاع نفس الـ deviceId القديم  │
│     └─ نعم، MAC مختلف ← رفض الطلب (403 Reject)           │
│  3. إرسال الـ deviceId في الاستجابة ليقوم التطبيق بحفظه   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│                  نقطة الوصول (واي فاي القاعة)             │
│                                                          │
│  1. يتصل الطالب بواي فاي القاعة                          │
│  2. ترسل نقطة الوصول الماك أدريس للسيرفر                 │
│  3. السيرفر يبحث بالـ MAC Address ← يجد الطالب            │
│  4. إذا وجد الطالب ← يسجل الحضور تلقائياً ✅              │
└─────────────────────────────────────────────────────────┘
```

---

### ❓ الأسئلة الشائعة (FAQ)

| السؤال                                           | الإجابة                                                                |
| :----------------------------------------------- | :--------------------------------------------------------------------- |
| هل الـ MAC Address بيتغير لو مسحت التطبيق؟       | **لا** - ثابت لأنه عنوان فيزيائي لكارت الشبكة.                         |
| هل الـ MAC Address بيتغير لو عملت factory reset؟ | **لا** - عنوان الـ MAC ثابت في العتاد.                                 |
| هل الـ deviceId بيتغير لو مسحت التطبيق؟          | **لا** - لأن السيرفر سيعرفك من الـ MAC Address ويرسل لك نفس الـ ID.    |
| ماذا لو اشتريت موبايل جديد؟                      | يجب عمل طلب تغيير جهاز (Device Change Request) ليقوم الأدمن بالموافقة. |

---

## 🛡️ نصائح أمنية

1. **لا تضع** رابط السيرفر بشكل مباشر في الكود (Hardcode)، استخدم ملف إعدادات البيئة (Environment Config).
2. قم بتخزين التوكنز والـ `deviceId` في **مخزن آمن** (`flutter_secure_storage`) وليس SharedPreferences العادية.
3. قم بمسح التوكنز عند تسجيل الخروج (مع الاحتفاظ بـ deviceId المحفوظ محلياً للسرعة).
4. الـ `deviceId` هو قيمة **للقراءة فقط** تأتي من السيرفر، لا تقم بتوليدها من طرف التطبيق أبداً.

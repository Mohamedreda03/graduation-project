# 🎓 نظام الحضور الذكي - التوثيق الكامل

## 📋 فهرس المحتويات

1. [نظرة عامة على المشروع](#1-نظرة-عامة-على-المشروع)
2. [هيكل المشروع](#2-هيكل-المشروع)
3. [قاعدة البيانات (Models)](#3-قاعدة-البيانات-models)
4. [واجهة البرمجة (Backend API)](#4-واجهة-البرمجة-backend-api)
5. [لوحات التحكم (Dashboards)](#5-لوحات-التحكم-dashboards)
6. [نظام نقطة الوصول (Access Point)](#6-نظام-نقطة-الوصول-access-point)
7. [آلية تسجيل الحضور](#7-آلية-تسجيل-الحضور)
8. [نظام الأمان والتوثيق](#8-نظام-الأمان-والتوثيق)
9. [الجدولة التلقائية (Scheduler)](#9-الجدولة-التلقائية-scheduler)
10. [دليل التشغيل](#10-دليل-التشغيل)

---

## 1. نظرة عامة على المشروع

### 1.1 المشكلة

الأنظمة التقليدية لتسجيل الحضور تعاني من عدة مشاكل:

- **الكشوف الورقية:** بطيئة وسهلة التزوير (طالب يوقع لزميله)
- **رموز QR:** يمكن إرسال صورة الكود لطالب خارج القاعة
- **البصمة:** مكلفة وتسبب طوابير طويلة

### 1.2 الحل

نظام حضور آلي يعتمد على **مراقبة الشبكة المحلية**. عندما يتصل جهاز الطالب (موبايل/لابتوب) بشبكة Wi-Fi الخاصة بالقاعة، يتم تسجيل حضوره تلقائياً.

### 1.3 مميزات النظام

✅ تسجيل حضور تلقائي بدون تدخل بشري  
✅ منع التزوير (كل طالب مرتبط بجهاز واحد فقط)  
✅ تقارير فورية للدكتور والإدارة  
✅ حساب نسبة الحضور والتأخير تلقائياً  
✅ لا يحتاج الطالب لتثبيت تطبيق

---

## 2. هيكل المشروع

```
graduation-project/
│
├── backend/                    # السيرفر (Node.js + Express)
│   ├── src/
│   │   ├── config/            # إعدادات (قاعدة البيانات، المتغيرات)
│   │   ├── controllers/       # منطق العمليات (CRUD)
│   │   ├── middlewares/       # التحقق من الهوية والصلاحيات
│   │   ├── models/            # هيكل قاعدة البيانات (Mongoose)
│   │   ├── routes/            # مسارات API
│   │   ├── services/          # خدمات (الجدولة، الحسابات)
│   │   ├── utils/             # أدوات مساعدة
│   │   └── validators/        # التحقق من البيانات
│   ├── server.js              # نقطة البداية
│   └── .env                   # المتغيرات السرية
│
├── admin-dashboard/           # لوحة تحكم المسؤول (React)
│   ├── src/
│   │   ├── components/        # المكونات القابلة لإعادة الاستخدام
│   │   ├── contexts/          # إدارة الحالة (Auth Context)
│   │   ├── hooks/             # React Hooks مخصصة
│   │   ├── layouts/           # تخطيط الصفحات
│   │   ├── pages/             # صفحات التطبيق
│   │   ├── services/          # اتصال API
│   │   └── types/             # TypeScript Types
│   └── ...
│
├── doctor-dashboard/          # لوحة تحكم الدكتور (React)
│   └── ... (نفس الهيكل)
│
├── access_point.py            # سكريبت مراقبة الشبكة (Python)
└── *.md                       # ملفات التوثيق
```

---

## 3. قاعدة البيانات (Models)

### 3.1 المستخدم (User)

```javascript
{
  studentId: "20220001",           // رقم الطالب (للطلاب فقط)
  email: "ahmed@university.edu",
  password: "hashed...",           // مشفرة
  name: { first: "أحمد", last: "محمد" },
  role: "student | doctor | admin",

  // معلومات أكاديمية (للطلاب)
  academicInfo: {
    department: ObjectId,          // القسم
    level: 3,                      // الفرقة
    enrolledCourses: [ObjectId]    // المواد المسجل بها
  },

  // ربط الجهاز (الطالب = جهاز واحد فقط!)
  device: {
    macAddress: "AA:BB:CC:DD:EE:FF",
    deviceName: "iPhone 15",
    isVerified: true
  }
}
```

### 3.2 القسم (Department)

```javascript
{
  name: "قسم علوم الحاسب",
  code: "CS",
  faculty: "كلية الحاسبات والمعلومات"
}
```

### 3.3 المادة (Course)

```javascript
{
  name: "برمجة متقدمة",
  code: "CS301",
  department: ObjectId,
  doctor: ObjectId,                // الدكتور المسؤول
  level: 3,
  semester: "Fall 2025",
  students: [ObjectId, ObjectId]   // الطلاب المسجلين
}
```

### 3.4 القاعة (Hall)

```javascript
{
  name: "قاعة 101",
  building: "المبنى الرئيسي",
  capacity: 50,

  // معلومات نقطة الوصول
  accessPoint: {
    apIdentifier: "AP_101",        // المعرف الفريد
    ssid: "Hall_101_WiFi",
    ipRange: "192.168.137",
    apiKey: "secret_key_...",      // مفتاح الأمان
    isOnline: true,
    lastSeen: "2026-02-04T10:30:00"
  }
}
```

### 3.5 المحاضرة (Lecture)

```javascript
{
  course: ObjectId,
  hall: ObjectId,
  doctor: ObjectId,
  dayOfWeek: 0,                    // 0=الأحد، 6=السبت
  startTime: "09:00",
  endTime: "10:30",
  isActive: true
}
```

### 3.6 سجل الحضور (AttendanceRecord)

```javascript
{
  student: ObjectId,
  lecture: ObjectId,
  course: ObjectId,
  hall: ObjectId,
  date: "2026-02-04",

  // جلسات الحضور (يمكن الدخول والخروج عدة مرات)
  sessions: [
    { checkIn: "09:05", checkOut: "09:45" },
    { checkIn: "10:00", checkOut: "10:30" }
  ],

  totalPresenceTime: 70,           // بالدقائق
  presencePercentage: 78,          // النسبة المئوية
  status: "present | absent | in-progress",
  isFinalized: true
}
```

### 3.7 سجل الاتصالات (ConnectionLog)

```javascript
{
  macAddress: "AA:BB:CC:DD:EE:FF",
  hall: ObjectId,
  eventType: "device-connected | device-disconnected",
  timestamp: "2026-02-04T09:05:22",
  processed: true,
  processingResult: "Check-in recorded for lecture"
}
```

### 3.8 جلسة الطالب (StudentSession)

```javascript
{
  student: ObjectId,
  currentHall: ObjectId,
  macAddress: "AA:BB:CC:DD:EE:FF",
  connectedAt: "2026-02-04T09:05:00",
  isActive: true
}
```

---

## 4. واجهة البرمجة (Backend API)

### 4.1 مسارات التوثيق (Auth)

| المسار                  | الطريقة | الوصف                   |
| ----------------------- | ------- | ----------------------- |
| `/api/auth/web/login`   | POST    | تسجيل دخول (أدمن/دكتور) |
| `/api/auth/web/logout`  | POST    | تسجيل خروج              |
| `/api/auth/web/refresh` | POST    | تجديد التوكن            |
| `/api/auth/me`          | GET     | بيانات المستخدم الحالي  |

### 4.2 مسارات الطلاب (Students)

| المسار                 | الطريقة | الوصف                 |
| ---------------------- | ------- | --------------------- |
| `/api/students`        | GET     | جميع الطلاب           |
| `/api/students/:id`    | GET     | طالب محدد             |
| `/api/students`        | POST    | إضافة طالب            |
| `/api/students/:id`    | PUT     | تعديل طالب            |
| `/api/students/:id`    | DELETE  | حذف طالب              |
| `/api/students/import` | POST    | استيراد طلاب من Excel |

### 4.3 مسارات المواد (Courses)

| المسار                      | الطريقة | الوصف       |
| --------------------------- | ------- | ----------- |
| `/api/courses`              | GET     | جميع المواد |
| `/api/courses/:id/students` | GET     | طلاب المادة |
| `/api/courses/:id/enroll`   | POST    | تسجيل طلاب  |

### 4.4 مسارات القاعات (Halls)

| المسار                        | الطريقة | الوصف                        |
| ----------------------------- | ------- | ---------------------------- |
| `/api/halls`                  | GET     | جميع القاعات                 |
| `/api/halls/:id/status`       | GET     | حالة القاعة (Online/Offline) |
| `/api/halls/:id/access-point` | PUT     | تحديث نقطة الوصول            |

### 4.5 مسارات الاتصالات (Connections)

| المسار                   | الطريقة | الوصف                 |
| ------------------------ | ------- | --------------------- |
| `/api/connections/event` | POST    | استقبال أحداث الاتصال |
| `/api/connections`       | GET     | سجل الاتصالات         |

### 4.6 مسارات الحضور (Attendance)

| المسار                        | الطريقة | الوصف         |
| ----------------------------- | ------- | ------------- |
| `/api/attendance`             | GET     | سجلات الحضور  |
| `/api/attendance/lecture/:id` | GET     | حضور محاضرة   |
| `/api/attendance/student/:id` | GET     | حضور طالب     |
| `/api/attendance/reports`     | GET     | تقارير الحضور |

---

## 5. لوحات التحكم (Dashboards)

### 5.1 لوحة تحكم المسؤول (Admin Dashboard)

**الرابط:** `http://localhost:5173`

#### الصفحات المتاحة:

- **لوحة المعلومات:** إحصائيات عامة (عدد الطلاب، المحاضرات اليوم، نسب الحضور)
- **الأقسام:** إضافة/تعديل/حذف الأقسام الأكاديمية
- **الطلاب:** إدارة الطلاب + استيراد من Excel + ربط أجهزة MAC
- **الدكاترة:** إدارة حسابات الدكاترة
- **المواد:** إنشاء المواد وربطها بالدكاترة والأقسام
- **القاعات:** إدارة القاعات ونقاط الوصول
- **المحاضرات:** جدول المحاضرات الأسبوعي
- **الحضور:** عرض سجلات الحضور والتقارير
- **الإعدادات:** إعدادات النظام (نسبة الحضور المطلوبة، وقت التأخير)

### 5.2 لوحة تحكم الدكتور (Doctor Dashboard)

**الرابط:** `http://localhost:5174`

#### الصفحات المتاحة:

- **لوحة المعلومات:** محاضرات اليوم، إحصائيات المواد
- **موادي:** قائمة المواد التي يدرسها
- **جدولي:** جدول المحاضرات الأسبوعي
- **الحضور:** عرض وتعديل حضور الطلاب في محاضراته

---

## 6. نظام نقطة الوصول (Access Point)

### 6.1 ما هي نقطة الوصول؟

هي جهاز (لابتوب أو Raspberry Pi) يعمل كـ "بوابة" في القاعة، يراقب الأجهزة المتصلة بالشبكة ويرسل البيانات للسيرفر.

### 6.2 كيف تعمل؟

```
┌──────────────────────────────────────────────────────────────┐
│                        القاعة 101                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   📱 موبايل أحمد ─────┐                                      │
│                       │                                      │
│   📱 موبايل سارة ─────┼────► 📶 Hotspot ────► 💻 السكريبت   │
│                       │         (اللابتوب)      (Python)     │
│   📱 موبايل محمد ─────┘                              │       │
│                                                      │       │
└──────────────────────────────────────────────────────│───────┘
                                                       │
                                                       ▼
                                              🌐 Backend Server
                                                       │
                                                       ▼
                                              📊 قاعدة البيانات
```

### 6.3 خطوات العمل بالتفصيل

#### الخطوة 1: فحص الشبكة (Network Scan)

```python
# يرسل ping لكل IP في النطاق
for i in range(2, 255):
    ip = "192.168.137." + str(i)
    ping(ip)  # إذا رد الجهاز = موجود
```

#### الخطوة 2: استخراج MAC Address

```python
# بعد الـ ping، نقرأ جدول ARP
output = subprocess.check_output("arp -a")
# النتيجة: 192.168.137.5 --> AA-BB-CC-DD-EE-FF
```

#### الخطوة 3: إرسال الحدث للسيرفر

```python
requests.post(
    "http://localhost:5000/api/connections/event",
    json={
        "eventType": "device-connected",
        "macAddress": "AA:BB:CC:DD:EE:FF",
        "apIdentifier": "AP_101"
    },
    headers={"X-API-Key": "secret_key"}
)
```

#### الخطوة 4: نبضة القلب (Heartbeat)

```python
# كل 60 ثانية، يرسل إشارة "أنا شغال"
while True:
    requests.post(..., json={"eventType": "heartbeat"})
    time.sleep(60)
```

### 6.4 إعدادات السكريبت (access_point.py)

```python
AP_IDENTIFIER = "AP_101"           # معرف القاعة (يجب أن يتطابق مع قاعدة البيانات)
SUBNET = "192.168.137."            # نطاق IP الهوت سبوت
BACKEND_URL = "http://localhost:5000/api"
AP_API_KEY = "your_access_point_api_key_change_this"
HEARTBEAT_INTERVAL = 60            # إرسال نبضة كل 60 ثانية
MAX_MISSED_PINGS = 3               # بعد 3 محاولات فاشلة = الجهاز غادر
```

---

## 7. آلية تسجيل الحضور

### 7.1 السيناريو الكامل

| الوقت | الحدث                      | استجابة النظام                          |
| ----- | -------------------------- | --------------------------------------- |
| 08:55 | الدكتور يدخل القاعة        | لا شيء (المحاضرة لم تبدأ)               |
| 09:00 | المحاضرة تبدأ (حسب الجدول) | النظام يبدأ بانتظار الطلاب              |
| 09:05 | أحمد يتصل بالـ WiFi        | ✅ Check-in: سجل حضور + بداية جلسة      |
| 09:30 | أحمد يغادر (انقطع WiFi)    | ⏸️ Check-out: نهاية الجلسة (25 دقيقة)   |
| 09:45 | أحمد يعود                  | ✅ Check-in: بداية جلسة جديدة           |
| 10:30 | المحاضرة تنتهي             | ⏹️ إغلاق الجلسة المفتوحة                |
| 11:00 | Scheduler يعمل             | 📊 حساب: 25 + 45 = 70 دقيقة من 90 = 78% |
| 11:00 | النتيجة النهائية           | ❌ غائب (أقل من 85%)                    |

### 7.2 كود معالجة الاتصال (Backend)

```javascript
// عند استقبال "device-connected"
exports.handleConnectionEvent = async (req, res) => {
  const { macAddress, apIdentifier } = req.body;

  // 1. البحث عن القاعة
  const hall = await Hall.findOne({ "accessPoint.apIdentifier": apIdentifier });

  // 2. البحث عن الطالب بـ MAC
  const student = await User.findOne({ "device.macAddress": macAddress });

  // 3. البحث عن محاضرة نشطة الآن
  const lecture = await Lecture.findActiveLecture(hall._id);

  // 4. التحقق من تسجيل الطالب في المادة
  if (lecture.course.students.includes(student._id)) {
    // 5. إنشاء سجل حضور
    await AttendanceRecord.create({
      student: student._id,
      lecture: lecture._id,
      sessions: [{ checkIn: new Date() }],
    });
  }
};
```

### 7.3 حساب نسبة الحضور

```javascript
// بعد انتهاء المحاضرة
attendanceRecord.finalize = function (lectureTime, minPercentage = 85) {
  // حساب إجمالي وقت الحضور
  let totalMinutes = 0;
  for (const session of this.sessions) {
    totalMinutes += (session.checkOut - session.checkIn) / 60000;
  }

  // حساب النسبة
  this.presencePercentage = (totalMinutes / lectureTime) * 100;

  // تحديد الحالة النهائية
  this.status = this.presencePercentage >= minPercentage ? "present" : "absent";
};
```

---

## 8. نظام الأمان والتوثيق

### 8.1 توثيق المستخدمين (JWT)

```javascript
// عند تسجيل الدخول
const accessToken = jwt.sign({ id: user._id }, SECRET, { expiresIn: "15m" });
const refreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, {
  expiresIn: "7d",
});

// يتم إرسالها كـ httpOnly cookies (أكثر أماناً)
res.cookie("accessToken", accessToken, { httpOnly: true });
```

### 8.2 توثيق نقاط الوصول (API Keys)

```javascript
// في الـ middleware
const verifyAccessPoint = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  // التحقق من المفتاح العام
  if (apiKey === process.env.AP_API_KEY) {
    return next();
  }

  // أو المفتاح الخاص بالقاعة
  const hall = await Hall.findOne({ "accessPoint.apiKey": apiKey });
  if (hall) {
    req.hall = hall;
    return next();
  }

  throw new Error("Unauthorized");
};
```

### 8.3 حماية من التزوير

1. **جهاز واحد لكل طالب:** لا يمكن تسجيل أكثر من MAC Address
2. **تحقق من الوقت:** الحضور يُسجل فقط أثناء وقت المحاضرة الفعلي
3. **تحقق من المكان:** MAC Address يظهر فقط إذا كان الجهاز في نطاق الـ WiFi (~20-30 متر)

---

## 9. الجدولة التلقائية (Scheduler)

### 9.1 المهام المجدولة

```javascript
// كل 5 دقائق: إنهاء سجلات الحضور
cron.schedule("*/5 * * * *", finalizeAttendanceRecords);

// كل ساعة: تسجيل الغياب للطلاب الذين لم يحضروا
cron.schedule("30 * * * *", markAbsentStudents);

// كل ساعة: تنظيف الجلسات المعلقة
cron.schedule("0 * * * *", cleanupStaleSessions);
```

### 9.2 إنهاء سجلات الحضور

```javascript
async function finalizeAttendanceRecords() {
  // البحث عن سجلات "in-progress"
  const records = await AttendanceRecord.find({
    status: "in-progress",
    isFinalized: false,
  });

  for (const record of records) {
    // إذا انتهت المحاضرة منذ 30 دقيقة
    if (lectureEndedMoreThan30MinutesAgo(record)) {
      record.finalize(); // حساب النسبة وتحديد الحالة
    }
  }
}
```

---

## 10. دليل التشغيل

### 10.1 المتطلبات

- Node.js 18+
- Python 3.x
- MongoDB (أو Docker)
- Windows (لتشغيل Hotspot)

### 10.2 تشغيل قاعدة البيانات

```bash
cd backend
docker-compose up -d
```

### 10.3 تشغيل السيرفر

```bash
cd backend
npm install
npm run dev
```

### 10.4 تشغيل لوحة الأدمن

```bash
cd admin-dashboard
npm install
npm run dev
```

### 10.5 تشغيل لوحة الدكتور

```bash
cd doctor-dashboard
npm install
npm run dev
```

### 10.6 تشغيل نقطة الوصول

```bash
# 1. فعّل Mobile Hotspot من الإعدادات
# 2. شغل السكريبت
pip install requests
python access_point.py
```

### 10.7 إعداد البيانات التجريبية

```bash
cd backend
node src/seeders/seed-large.js
```

---

## 📞 معلومات الفريق

- تاريخ الإنشاء: 2026
- المشروع: نظام الحضور الذكي
- الجامعة: [اسم الجامعة]

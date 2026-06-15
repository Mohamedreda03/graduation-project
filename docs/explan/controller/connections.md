# 🔌 التوثيق الشامل والمفصل لمتحكم الاتصالات (Connections Controller)

متحكم الاتصالات هو المكون البرمجي المسؤول عن معالجة البيانات القادمة من البنية التحتية للشبكة (الـ Access Points). يعمل هذا المتحكم كجسر يربط بين الأحداث الفيزيائية (اتصال وانفصال الأجهزة بشبكة القاعة) وبين المنطق البرمجي لقاعدة البيانات (تسجيل حضور وغياب الطلاب).

يمتاز هذا المتحكم بتصميمه الذي يراعي استمرارية الخدمة، وحماية النظام من التزوير، ومعالجة انقطاع الاتصال المؤقت للشبكة دون فقدان بيانات الطالب.

---

## 🌐 روابط ومسارات الـ Endpoints الكاملة

| الطريقة (Method) | الـ URL الكامل | الصلاحية (Auth) | الوصف |
| :--- | :--- | :--- | :--- |
| **POST** | `http://localhost:5000/api/connections/event` | مفتاح الأمان للـ AP (`X-API-Key`) | استقبال حدث الشبكة (اتصال/قطع/نبضة قلب) |
| **GET** | `http://localhost:5000/api/connections` | الأدمن فقط (`Bearer Token`) | جلب كل سجلات الاتصال في قاعدة البيانات |
| **GET** | `http://localhost:5000/api/connections/unprocessed` | الأدمن فقط (`Bearer Token`) | جلب السجلات التي لم يتم معالجتها بنجاح |
| **GET** | `http://localhost:5000/api/connections/hall/:hallId` | الأدمن فقط (`Bearer Token`) | جلب سجلات الاتصال الخاصة بقاعة معينة |
| **POST** | `http://localhost:5000/api/connections/:id/reprocess` | الأدمن فقط (`Bearer Token`) | إعادة معالجة حدث اتصال/قطع معين بأثر رجعي |

---

## 🧠 التصميم المنطقي والحلول البرمجية للمشكلات الفنية

### 1. مشكلة الانقطاع المتكرر للشبكة (Wi-Fi Drops)
في البيئات التعليمية، قد ينقطع اتصال هاتف الطالب بالـ Wi-Fi بشكل متكرر أثناء المحاضرة بسبب تحركه أو ضعف الإشارة. لو قام النظام بتسجيل حضور الطالب بمجرد اتصاله لمرة واحدة، لسهل التلاعب؛ ولو سجله غائباً بمجرد انقطاعه، لظلم الطالب.
* **الحل البرمجي:** يعتمد النظام على مصفوفة من الجلسات الفرعية (`sessions`) داخل مستند الحضور الواحد `AttendanceRecord`. في كل مرة يتصل الطالب، يتم فتح جلسة جديدة (`checkIn`). وعندما ينقطع اتصاله، يتم إغلاق هذه الجلسة الفرعية (`checkOut`) وحساب مدة بقائه بالدقائق وإضافتها لعداد تراكمي (`totalPresenceTime`). في نهاية المحاضرة، يتم جمع كل الجلسات الفرعية لحساب إجمالي زمن الحضور الفعلي.

### 2. التحقق من تطابق الأجهزة ومنع انتحال الشخصية (Anti-Spoofing)
من السهل على الطلاب مشاركة كود الحضور أو مسح كود QR نيابة عن بعضهم البعض.
* **الحل البرمجي:** يرتبط كل طالب بجهاز مادي واحد فقط عبر الماك أدريس (`macAddress`). عندما ترسل نقطة الوصول حدث اتصال، يتحقق السيرفر أولاً هل هذا العنوان الفيزيائي مسجل للطالب ومفعّل من الإدارة؟ وهل الطالب مسجل بالفعل في هذه المادة؟ إذا اختل أي شرط، يتم تجاهل الحدث وحفظه في سجلات الأخطاء فقط لمنع الحضور الوهمي.

### 3. نبضة القلب (Heartbeat) ومراقبة القاعات
كيف يتأكد النظام أن نقطة الوصول في القاعة تعمل بشكل سليم وليست مطفأة؟
* **الحل البرمجي:** يرسل السكريبت في القاعة إشارة دورية كل 60 ثانية تسمى `heartbeat`. تستقبلها هذه الـ Endpoint وتعمل على تحديث حقل `lastSeen` و `isOnline` للقاعة في قاعدة البيانات، مما يتيح للأدمن في لوحة التحكم رؤية القاعات النشطة والشبكات المفعلة لحظة بلحظة.

---

## 🔍 شرح تفصيلي لتدفق الكود والوظائف (Detailed Walkthrough)

### 1. معالجة الحدث الرئيسي: `handleConnectionEvent`
هذه الدالة هي البوابة المشتركة لجميع البيانات القادمة من القاعات.

```javascript
const macAddress = normalizeMacAddress(req.body.macAddress);
```
* **الشرح الفلسفي:** عناوين MAC قد تُكتب بحروف صغيرة أو كبيرة، أو تفصل بينها نقطتان فوقيتان `:` أو شرطة `-`. تقوم دالة `normalizeMacAddress` بتوحيد شكل العنوان برمجياً (حروف كبيرة ومفصولة بنقطتين) لضمان دقة استعلامات قاعدة البيانات بنسبة 100%.

```javascript
let hall = null;
if (apIdentifier) {
  hall = await Hall.findOne({ "accessPoint.apIdentifier": apIdentifier });
}
```
* **الشرح الفلسفي:** يجب ربط الحدث بالقاعة الصحيحة. يقوم النظام بالبحث في جدول [Hall](file:///d:/work-now/graduation-project/backend/src/models/Hall.js) عن القاعة التي تملك جهاز مراقبة متطابق مع المعرف المرسل. بعد العثور عليها، يتم استدعاء دالة `hall.updateApStatus(true)` لتسجيل أن القاعة متصلة حالياً بالإنترنت.

```javascript
const connectionLog = await ConnectionLog.create({
  macAddress,
  hall: hall._id,
  eventType,
  processed: false
});
```
* **الشرح الفلسفي:** الحفاظ على أثر العمليات (Audit Trail). يتم كتابة الحدث فوراً في جدول [ConnectionLog](file:///d:/work-now/graduation-project/backend/src/models/ConnectionLog.js) كحالة "غير معالجة" (`processed: false`). هذا يضمن أنه في حال حدوث أي انقطاع مفاجئ للسيرفر أو خطأ في الداتابيز، يكون لدينا سجل مادي بكافة الاتصالات الفعلية لإعادة معالجتها لاحقاً.

```javascript
const student = await User.findByDeviceIdentifier(macAddress);
```
* **الشرح الفلسفي:** يقوم السيرفر بالتحقق من هوية الطالب بمطابقة الماك أدريس الفيزيائي بالماك المسجل في حسابه. إذا لم يتم العثور على مستخدم يطابق هذا الجهاز، يتم تحديث اللوج وكتابة نتيجة المعالجة بأن الجهاز غير معروف، وينتهي الطلب بسلام دون إحداث أي خلل برمجي.

---

### 2. منطق تسجيل الدخول الفعلي: `handleConnect`
يتم استدعاء هذه الدالة عندما يرسل السكريبت حدث `device-connected` (اتصال جهاز طالب مسجل بالواي فاي).

```javascript
let session = await StudentSession.findOne({ student: student._id, isActive: true });
if (session) {
  session.currentHall = hall._id;
  session.connectedAt = now;
  await session.save();
} else {
  session = await StudentSession.create({ ... });
}
```
* **الشرح الفلسفي:** إدارة الجلسات اللحظية. يمثل جدول [StudentSession](file:///d:/work-now/graduation-project/backend/src/models/StudentSession.js) الجدول اللحظي لحالة الطلاب الحالية. تفحص الدالة أولاً: هل للطالب جلسة نشطة بالفعل في السيستم؟ 
  * إذا كان متصلاً مسبقاً بقاعة أخرى وانتقل لقاعة جديدة، يتم تحديث الجلسة بالقاعة الجديدة فوراً لتجنب تكرار السجلات المفتوحة.
  * إذا لم تكن له جلسة نشطة، يتم إنشاء مستند جلسة جديدة وتعيينه كـ `isActive: true`.

```javascript
const activeLecture = await Lecture.findActiveLecture(hall._id);
```
* **الشرح الفلسفي:** لا يمكن تسجيل حضور الطالب إلا إذا كانت هناك محاضرة قائمة بالفعل في هذه القاعة وفي هذا الوقت. تستدعي الدالة ميثود `findActiveLecture` في موديل [Lecture](file:///d:/work-now/graduation-project/backend/src/models/Lecture.js) لمطابقة الوقت الحالي ويوم الأسبوع بجدول المحاضرات المسجل في الداتابيز.

```javascript
const isEnrolled = courseStudents.some(s => s.toString() === student._id.toString());
```
* **الشرح الفلسفي:** التحقق الأكاديمي. حتى لو كان الطالب متواجداً بالقاعة، يجب ألا يسجل حضوراً في مادة لا تتبع فرقته الدراسية أو غير مسجل بها أكاديمياً. يتحقق الكود من وجود معرف الطالب في قائمة المادة قبل اتخاذ أي خطوة.

```javascript
let attendanceRecord = await AttendanceRecord.findOne({
  student: student._id,
  lecture: activeLecture._id,
  date: getTodayDate()
});
```
* **الشرح الفلسفي:** تبحث الدالة عن كشف حضور الطالب لهذه المحاضرة اليوم.
  * **إذا كان الطالب يدخل القاعة لأول مرة اليوم:** يتم إنشاء مستند حضور جديد وحالته المبدئية `in-progress` (قيد المعالجة لأن المحاضرة لم تنتهِ بعد)، ويتم إضافة تيمبستامب الدخول في مصفوفة الجلسات: `sessions: [{ checkIn: now }]`.
  * **إذا كان الطالب قد خرج مؤخراً ورجع مجدداً:** يتم تحويل الحالة مجدداً لـ `in-progress` ويتم دفع توقيت دخول جديد في المصفوفة لحساب مدة البقاء التراكمية لاحقاً.

---

### 3. منطق تسجيل الخروج والمغادرة: `handleDisconnect`
يتم استدعاء هذه الدالة عند إرسال حدث `device-disconnected` (مغادرة جهاز الطالب لنطاق شبكة الواي فاي).

```javascript
const session = await StudentSession.findOne({
  student: student._id,
  currentHall: hall._id,
  isActive: true
});
```
* **الشرح الفلسفي:** يبحث النظام عن الجلسة اللحظية المفتوحة للطالب في هذه القاعة للبدء في حساب وقت الخروج.

```javascript
if (attendanceRecord && attendanceRecord.sessions.length > 0) {
  const lastSession = attendanceRecord.sessions[attendanceRecord.sessions.length - 1];
  if (!lastSession.checkOut) {
    lastSession.checkOut = now;
    const durationMinutes = calculateMinutes(lastSession.checkIn, lastSession.checkOut);
    lastSession.duration = durationMinutes;
    attendanceRecord.totalPresenceTime += durationMinutes;
  }
}
```
* **الشرح الفلسفي:** حساب وقت الحضور التراكمي بدقة.
  1. يسترجع السيرفر كشف الحضور ويذهب لآخر جلسة دخول مضافة (`lastSession`).
  2. إذا لم يكن مسجلاً لها وقت خروج (وهذا هو الطبيعي)، يتم تسجيل الوقت الحالي كوقت خروج رسمي لهذه الجلسة الفرعية.
  3. يتم حساب الفارق الزمني بالدقائق وحفظه في حقل `duration` الخاص بالجلسة.
  4. يتم جمع هذه الدقائق وإضافتها لحقل `totalPresenceTime` التراكمي للطالب في هذه المحاضرة.

```javascript
session.isActive = false;
session.disconnectedAt = now;
await session.save();
```
* **الشرح الفلسفي:** تحويل الجلسة اللحظية للطالب في [StudentSession](file:///d:/work-now/graduation-project/backend/src/models/StudentSession.js) إلى غير نشطة (`isActive = false`) وتسجيل تاريخ الخروج، وبذلك ينتهي ظهور الجلسة كحالة نشطة في تطبيق الموبايل، ويسجل النظام في لوج المعالجة النهائي نجاح عملية الخروج.

---

### 4. ميزة إعادة المعالجة: `reprocessLog`
* **المسار:** `POST http://localhost:5000/api/connections/:id/reprocess`
* **الوصف الفلسفي:** ماذا لو رصد جهاز الهوت سبوت دخول جهاز ماك أدريس لطالب، ولكن الطالب لم يكن قد سجل حسابه بعد على تطبيق الموبايل، أو لم يكن الأدمن قد وافق على تفعيل جهازه؟
  في هذه الحالة، سيسجل السيرفر الحدث كـ "لوج غير معالج لعدم وجود طالب مرتبط بالماك". بعد أن يقوم الأدمن بربط الجهاز وتفعيله، يمكن للأدمن الضغط على زر "إعادة معالجة" في لوحة التحكم؛ لتقوم دالة `reprocessLog` بقراءة اللوج القديم وتمريره من جديد لدوال `handleConnect` أو `handleDisconnect` ليتلقى الطالب حضوره بأثر رجعي دون أي ضياع لحقه في تسجيل الحضور.

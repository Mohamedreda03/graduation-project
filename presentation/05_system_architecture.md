# Slide 5: System Architecture & Workflow

## 👤 Presenter: Student 5
### ⏱️ Estimated Time: 2 Minutes

---

## 📊 PowerPoint Slide Content (English)
* **Hardware Layer**: Wi-Fi Access Points forwarding connect/disconnect events.
* **Core Server**: Central processing engine that handles business rules, schedules, and active sessions.
* **Data Persistence**: Secure database storing students, courses, lectures, and attendance metrics.
* **Dashboards**: 
  * *Admin Portal*: System setup, device approvals, and analytics.
  * *Doctor Portal*: Live lecture control and class monitoring.
* **Student Interface**: Mobile App showing schedules, warning badges, and device requests.

---

## 🎙️ Speaking Script (العامية المصرية)

"عشان الفكرة دي تتنفذ وتشتغل على أرض الواقع يا دكاترة، صممنا معمارية كاملة للنظام (Architecture) بتربط كل الأجزاء مع بعض في الوقت الحقيقي (Real-Time).

النظام بتاعنا بيتكون من خمسة أجزاء رئيسية شغالة مع بعض زي التروس:

أولاً، **الـ Access Points** اللي في المدرجات. دي بتلعب دور الكاشف؛ أول ما موبايل الطالب بيلقط الإشارة، الراوتر بيبعت إشعار سريع للخادم.

ثانياً، **الخادم الرئيسي (Central Server)**. ده العقل اللي بيفكر؛ بيستقبل الإشارة من الراوتر، ويروح يقارنها بالجدول الدراسي عشان يشوف: هل الطالب ده عنده محاضرة شغالة دلوقتي في المدرج ده فعلاً ومسجل في المادة دي؟ لو كله تمام، بيفتحله جلسة حضور نشطة ويبدأ يعد الدقائق.

ثالثاً، **قاعدة البيانات المركزية**، ودي اللي بنسجل فيها كل الهياكل الأكاديمية وجلسات الحضور والغياب بشكل سريع وآمن.

رابعاً، **لوحات التحكم (Dashboards)** على الويب، ودي مقسومة جزئين: لوحة **المسؤول (Admin)** عشان الإدارة والجدولة وتفعيل الهواتف، ولوحة **الدكتور (Doctor)** اللي بيعرضها على شاشة المدرج عشان يشوف الحضور والغياب لايف قدامه والطلبة بتتحضر.

خامساً، **تطبيق الموبايل بتاع الطالب (Student Mobile App)**. ده اللي الطالب بيشوف منه جدوله ومؤقت المحاضرة الجاية، وأول ما يدخل المدرج وتتحضر يظهرله بانر أخضر فوري يطمنه إنه كدة اتحضر رسمي.

التكامل ده بيخلي البيانات تلف في دايرة كاملة في ثواني معدودة؛ الطالب يدخل المدرج، الموبايل يلقط، الإشارة تروح للسيرفر، تظهر في لوحة الدكتور خضرا، وتظهر لافتة في موبايل الطالب تؤكد حضوره، من غير تدخل بشري واحد."

---

## ⚙️ معمارية تدفق البيانات (Data Integration Workflow)

1. **الطبقة الصلبة (Hardware Layer)**: ترسل أجهزة الـ Access Points إشعارات الاتصال بالشبكة إلى السيرفر.
2. **طبقة المعالجة (Backend Server)**: يستقبل السيرفر الطلبات، ويطابق الماك أدرس ببيانات الطلاب وجدول المحاضرات الجارية.
3. **طبقة العرض (Frontend/App Layer)**: يستقبل المتصفح والتطبيق التحديثات لحظياً لعرض بطاقة الطالب الخضراء للدكتور، وتأكيد التحضير للطالب على هاتفه.

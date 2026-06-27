# 📝 الشرح التفصيلي لسكريبت الـ MikroTik hAP ax2

هذا المستند يشرح بالتفصيل سكريبت الـ RouterOS (v7) المستخدم لتسجيل الحضور والغياب. سنقوم بشرح الكود سطرًا بسطر وبلغة بسيطة ومفهومة لكي تكون على دراية كاملة بآلية عمل كل جزء فيه.

---

## 🔍 الكود الكامل مع شرح تفصيلي لكل سطر

إليك السكريبت مقسمًا إلى أقسام منطقية مع شرح تفصيلي لكل أمر:

### ⚙️ القسم 1: الإعدادات والتهيئات الأساسية (Configuration)

```routeros
# ================== CONFIGURATION ==================
:local apIdentifier "AP-101"
:local backendUrl "http://192.168.88.253:5000/api/connections/event"
:local apiKey "MySuperSecretKey2024"
# ===================================================
```
* **`:local`**: كلمة مفتاحية لتعريف متغير محلي (Local Variable) ينتهي وجوده بانتهاء تشغيل السكريبت.
* **`apIdentifier`**: اسم أو معرّف القاعة الفريد (مثل "AP-101"). يجب أن يطابق القيمة المسجلة في السيرفر لكي يعرف السيرفر في أي قاعة تم تسجيل الحضور.
* **`backendUrl`**: الرابط المباشر للمنفذ (API) على لابتوبك لاستقبال الأحداث.
* **`apiKey`**: المفتاح السري المشترك بين الميكروتيك والسيرفر للتأكد من أمان الطلبات وحمايتها.

---

### 💾 القسم 2: تعريف الذاكرة وحفظ الحالة (Global Variables)

```routeros
:global LastConnectedMacs

# Initialize global variables if they don't exist
:if ([:typeof $LastConnectedMacs] = "nil") do={
    :set LastConnectedMacs [:toarray ""]
}
```
* **`:global LastConnectedMacs`**: تعريف متغير عام (Global Variable) **لا يُمحى** بانتهاء تشغيل السكريبت، بل يظل محفوظاً في ذاكرة الراوتر لكي نستخدمه في المقارنة بين الدورات البرمجية المتتالية.
* **`:if ([:typeof $LastConnectedMacs] = "nil")`**: شرط للتحقق مما إذا كان السكريبت يعمل لأول مرة بعد تشغيل الراوتر. إذا كان نوع المتغير `nil` (أي فارغ تماماً وغير معرّف):
  * **`:set LastConnectedMacs [:toarray ""]`**: نقوم بتهيئة المتغير كمصفوفة فارغة (Empty Array) لبدء تخزين الماك آدرسز بداخلها.

---

### 📡 القسم 3: جلب الأجهزة المتصلة بالواي فاي حالياً (Fetch Current Clients)

```routeros
# 1. Fetch currently connected MAC addresses
:local currentMacs [:toarray ""]

:foreach i in=[/interface/wifi/registration-table find] do={
    :local mac [/interface/wifi/registration-table get $i mac-address]
    :set currentMacs ($currentMacs , $mac)
}
```
* **`:local currentMacs [:toarray ""]`**: إنشاء مصفوفة محلية فارغة لتخزين الأجهزة المتصلة في هذه اللحظة بالذات.
* **`/interface/wifi/registration-table find`**: هذا الأمر يبحث في جدول تسجيل الأجهزة اللاسلكية النشطة (المتصلة بالواي فاي 6 في جهازك حالياً) ويرجع معرّفاتها.
* **`:foreach i in=[...] do={...}`**: حلقة تكرار (Loop) تمر على كل جهاز متصل حالياً بالـ Wi-Fi واحداً تلو الآخر:
  * **`/interface/wifi/registration-table get $i mac-address`**: تقوم باستخراج قيمة الـ **MAC Address** الفعلي للجهاز الحالي وحفظه في متغير محلي باسم `mac`.
  * **`:set currentMacs ($currentMacs , $mac)`**: تضيف الماك آدرس المستخرج إلى مصفوفة الأجهزة المتصلة حالياً `currentMacs` (عملية دمج/إضافة للمصفوفة).

---

### 🟢 القسم 4: اكتشاف دخول الطلاب القاعة (Device Connected Event)

```routeros
# 2. Check for new connections (Joined)
:foreach mac in=$currentMacs do={
    :local idx [:find $LastConnectedMacs $mac]
    :if ([:typeof $idx] = "nil") do={
        :log info "Attendance System: Device joined: $mac"
        :do {
            /tool/fetch url=$backendUrl \
                http-method=post \
                http-header-field="Content-Type:application/json,X-API-Key:$apiKey" \
                http-data="{\"eventType\":\"device-connected\",\"macAddress\":\"$mac\",\"apIdentifier\":\"$apIdentifier\"}" \
                keep-result=no;
        } on-error={
            :log warning "Attendance System: Failed to send join event for $mac"
        }
    }
}
```
* **`:foreach mac in=$currentMacs`**: حلقة تكرار تمر على جميع الماك آدرس المتصلة **الآن**:
  * **`:find $LastConnectedMacs $mac`**: تبحث عن هذا الماك في مصفوفة المتصلين **في المرة السابقة** (الذاكرة).
  * **`:if ([:typeof $idx] = "nil")`**: إذا لم تجده (أي أن نوع نتيجة البحث فارغة `nil`) ← فهذا يعني أن الهاتف اتصل بالشبكة حديثاً خلال الدقيقتين الماضيتين!
  * **`:log info "..."`**: يكتب رسالة في سجلات الميكروتيك (Log) لتسهيل المراقبة والتحقق.
  * **`/tool/fetch`**: أداة إرسال طلبات الويب للميكروتيك:
    * **`url=$backendUrl`**: ترسل للرابط المحدد للـ Backend.
    * **`http-method=post`**: نوع الطلب هو POST لإرسال بيانات.
    * **`http-header-field="..."`**: ترسل ترويسات الطلب؛ نحدد أن محتوى البيانات هو JSON ونرسل الـ API Key للتوثيق والأمان.
    * **`http-data="..."`**: جسم الطلب بصيغة JSON محتوياً على نوع الحدث (`device-connected`) والماك آدرس ومعرّف القاعة.
    * **`keep-result=no`**: يمنع الميكروتيك من حفظ رد السيرفر كملف على مساحة التخزين الداخلية لكي لا تمتلئ ذاكرة الراوتر.
  * **`on-error={...}`**: كود حماية؛ لو حدثت مشكلة انقطاع اتصال بالسيرفر، لا يتوقف السكريبت عن العمل بل يكتب تحذيراً في الـ Log فقط ويستمر.

---

### 🔴 القسم 5: اكتشاف خروج الطلاب من القاعة (Device Disconnected Event)

```routeros
# 3. Check for lost connections (Left)
:foreach mac in=$LastConnectedMacs do={
    :local idx [:find $currentMacs $mac]
    :if ([:typeof $idx] = "nil") do={
        :log info "Attendance System: Device left: $mac"
        :do {
            /tool/fetch url=$backendUrl \
                http-method=post \
                http-header-field="Content-Type:application/json,X-API-Key:$apiKey" \
                http-data="{\"eventType\":\"device-disconnected\",\"macAddress\":\"$mac\",\"apIdentifier\":\"$apIdentifier\"}" \
                keep-result=no;
        } on-error={
            :log warning "Attendance System: Failed to send leave event for $mac"
        }
    }
}
```
* **`:foreach mac in=$LastConnectedMacs`**: حلقة تكرار تمر على قائمة الأجهزة التي كانت متصلة **في المرة السابقة**:
  * **`:find $currentMacs $mac`**: تبحث عن الماك آدرس في قائمة المتصلين **حالياً**.
  * **`:if ([:typeof $idx] = "nil")`**: إذا لم تجده (أي أن نوع النتيجة `nil`) ← فهذا يعني أن الهاتف قد فصل اتصاله بالواي فاي أو غادر القاعة!
  * **`/tool/fetch ... eventType=device-disconnected`**: يرسل طلباً للسيرفر ليعلمه بأن هذا الطالب قد قطع اتصاله لتسجيل خروجه في قاعدة البيانات.

---

### 💓 القسم 6: نبضة الحياة الدورية للـ Access Point (Heartbeat)

```routeros
# 4. Heartbeat (Every run of the script - since it runs every 2 minutes)
:do {
    /tool/fetch url=$backendUrl \
        http-method=post \
        http-header-field="Content-Type:application/json,X-API-Key:$apiKey" \
        http-data="{\"eventType\":\"heartbeat\",\"macAddress\":\"00:00:00:00:00:00\",\"apIdentifier\":\"$apIdentifier\"}" \
        keep-result=no;
} on-error={
    :log warning "Attendance System: Failed to send heartbeat to backend"
}
```
* يقوم بإرسال طلب للسيرفر كل دقيقتين بنوع حدث `heartbeat` ومصحوباً بماك آدرس وهمي أصفار `00:00:00:00:00:00` لإخبار السيرفر أن الميكروتيك متصل بالشبكة وقائم بالخدمة بشكل صحيح لكي يظهر باللون الأخضر في لوحة التحكم.

---

### 💾 القسم 7: حفظ الحالة الحالية للتشغيل القادم

```routeros
# 5. Update last connected list
:set LastConnectedMacs $currentMacs
```
* **`:set LastConnectedMacs $currentMacs`**: نقوم بتخزين قائمة المتصلين **الحالية** كـ **قائمة المرة السابقة**؛ لكي نستخدمها في عملية المقارنة والفحص القادم بعد دقيقتين.

---

## 📈 ملخص منطق السكريبت (Flowchart)

```
[بدء تشغيل السكريبت كل دقيقتين]
               │
               ▼
   [قراءة مصفوفة المتصلين الحالية]
               │
               ▼
 [مقارنة الماك الحالية بذاكرة المرة السابقة]
   ├── هل هناك ماك جديد؟ ──► (نعم) ──► إرسال [device-connected]
   └── هل هناك ماك اختفى؟ ──► (نعم) ──► إرسال [device-disconnected]
               │
               ▼
       [إرسال Heartbeat] ──► لتأكيد أن الميكروتيك متصل بالإنترنت
               │
               ▼
[تحديث ذاكرة المرة السابقة بالمتصلين الحاليين]
               │
               ▼
         [انتهاء الدورة]
```

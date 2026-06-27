# 📶 دليل إعداد MikroTik hAP ax2 مع نظام تسجيل الحضور الذكي

تهانينا على شراء الـ **MikroTik hAP ax2**! هذا جهاز قوي جداً وسيجعل نظام تسجيل الحضور أكثر احترافية واستقراراً.

بدلاً من استخدام سكريبت الـ Python القديم (`access_point.py`) الذي يقوم بعملية فحص الشبكة (Ping Sweep) المُجهدة والمُعرضة للخطأ بسبب جدران الحماية بالهواتف الذكية، سنقوم بكتابة سكريبت داخلي في نظام **RouterOS (v7)** الخاص بالميكروتيك. هذا السكريبت سيراقب جدول المتصلين بالـ Wi-Fi (Registration Table) مباشرة من شريحة الشبكة ويرسل الأحداث فوراً للسيرفر.

---

## 💡 0. أول اتصال بجهاز الـ MikroTik (First Connection Setup)

لكي تستطيع الاتصال بالجهاز وبرمجته لأول مرة، اتبع الخطوات التالية:

### أ) الاتصال عبر الـ Wi-Fi:

1. قم بتوصيل الميكروتيك بالكهرباء وانتظر حوالي دقيقة حتى يقلع بالكامل.
2. ابحث عن شبكات الـ Wi-Fi في لابتوبك، ستجد شبكة باسم يبدأ بـ **`MikroTik-...`**.
3. **كلمة المرور الافتراضية (Password)**: ستجدها مطبوعة على **الملصق (Sticker)** الموجود أسفل أو على جانب جهاز الـ hAP ax2 نفسه، وتكون مكتوبة بجانب **Wireless Password** أو **WPA Key**.

### ب) الاتصال عبر كابل الشبكة (Ethernet) - خيار أسهل وبدون باسورد:

1. وصل كابل شبكة (Ethernet) من اللابتوب إلى **أي منفذ في الميكروتيك ما عدا المنفذ رقم 1** (لأن المنفذ 1 مخصص للإنترنت WAN).
2. بمجرد التوصيل، سيقوم الجهاز بالاتصال تلقائياً بدون طلب أي كلمة مرور للشبكة.

### ج) الدخول على لوحة التحكم (RouterOS Dashboard):

1. **عبر المتصفح**: افتح المتصفح واكتب العنوان التالي في شريط البحث: `http://192.168.88.1`.
2. **عبر برنامج WinBox (موصى به جداً)**:
   - قم بتحميل برنامج WinBox الصغير والمجاني من موقع ميكروتيك الرسمي: [MikroTik Downloads](https://mikrotik.com/download).
   - افتح البرنامج واضغط على تبويب **Neighbors** بالأسفل.
   - ستظهر لك معلومات الميكروتيك وعنوان الـ MAC الخاص به. اضغط على عنوان الـ MAC.
3. **بيانات تسجيل الدخول الافتراضية**:
   - اسم المستخدم (Username): **`admin`**
   - كلمة المرور (Password): **اتركها فارغة (فاضية تماماً)**، أو انظر للملصق أسفل الجهاز إذا كان هناك كلمة مرور افتراضية للـ admin.
   - عند الدخول لأول مرة، سيطلب منك كتابة كلمة مرور جديدة لحماية الجهاز (اكتب كلمة مرور تفتكرها كويس واضغط OK).

---

## 🔒 0.5. حل مشكلة الصلاحيات وتفعيل الوضع المتقدم (Enable Advanced Device-Mode)

تحديثات نظام ميكروتيك الجديدة (RouterOS 7.17+) تأتي بميزة أمان قوية تسمى **Device Mode**. تمنع هذه الميزة تشغيل أدوات مثل الجدولة (Scheduler) أو إرسال طلبات الويب (`fetch`) بشكل افتراضي لحماية الراوتر. لو ظهرت لك رسالة الخطأ باللون الأحمر `not allowed by device-mode` عند حفظ الجدولة، اتبع ما يلي لتفعيل الوضع المتقدم (**Advanced Mode**):

1. من القائمة اليسرى لبرنامج Winbox، اضغط على **New Terminal** لفتح نافذة الأوامر.
2. اكتب الأمر التالي ثم اضغط **Enter**:
   ```routeros
   /system/device-mode/update mode=advanced
   ```
3. ستظهر لك رسالة تفيد ببدء عد تنازلي وتطلب منك التأكيد الفعلي (Physical Confirmation).
4. **قم بفصل كابل الكهرباء (الباور) يدوياً من جهاز الميكروتيك**، انتظر 5 ثوانٍ، ثم **أعد توصيله**. (القيام بـ Reboot من السوفتوير لا ينفع، يجب فصل الكهرباء يدوياً).
5. بعد إقلاع الراوتر مرة أخرى، ستتمكن من إنشاء الجدولة (Scheduler) وحفظها بنجاح دون أي مشاكل.

---

## 📐 1. التوصيل وتحديد عنوان السيرفر (Network Topology)

السيرفر الخاص بك يعمل على لابتوبك الشخصي على المنفذ `5000` (أي `http://localhost:5000`). بما أن الميكروتيك جهاز خارجي منفصل، فهو لا يستطيع الوصول للعنوان `localhost`. يجب عليك توجيهه لعنوان الـ IP الخاص باللابتوب في الشبكة المحلية.

### لمعرفة عنوان IP اللابتوب:

1. قم بتوصيل اللابتوب بالـ MikroTik (سواء عبر كابل Ethernet أو بالاتصال بشبكة الـ Wi-Fi الخاصة به).
2. افتح الـ Command Prompt (CMD) على اللابتوب واكتب:
   ```cmd
   ipconfig
   ```
3. ابحث عن كارت الشبكة المتصل بالميكروتيك (مثلاً: `Wireless LAN adapter Wi-Fi` أو `Ethernet adapter`).
4. خذ عنوان الـ **IPv4 Address** (سيكون غالباً شيء مثل `192.168.88.254` أو `192.168.88.x`).
5. هذا العنوان هو ما سنضعه في السكريبت بدلاً من `localhost`.

---

## 📜 2. سكريبت الـ MikroTik RouterOS (v7)

قم بنسخ هذا السكريبت. تم تصميمه ليتوافق مع MikroTik hAP ax2 وتحديثات نظام RouterOS 7:

```routeros
# RouterOS Script for MikroTik hAP ax2 (RouterOS 7.13+)
# Monitors connected Wi-Fi devices and reports joins/leaves to the Attendance System Backend.
# Set this to run every 2 minutes in /system scheduler.

# ================== CONFIGURATION ==================
:local apIdentifier "AP_101"
:local backendUrl "http://192.168.88.253:5000/api/connections/event"
:local apiKey "MySuperSecretKey2024"
# ===================================================

:global LastConnectedMacs

# Initialize global variables if they don't exist
:if ([:typeof $LastConnectedMacs] = "nil") do={
    :set LastConnectedMacs [:toarray ""]
}

# Get the AP MAC Address dynamically from the first active wireless interface
:local apMac "00:00:00:00:00:00"
:do {
    :local wifiInterfaces [/interface/wifi/find where disabled=no]
    :if ([:len $wifiInterfaces] > 0) do={
        :set apMac [/interface/wifi/get ($wifiInterfaces->0) mac-address]
    }
} on-error={
    :log warning "Attendance System: Could not dynamically fetch WiFi MAC address"
}

# 1. Fetch currently connected MAC addresses
:local currentMacs [:toarray ""]

:foreach i in=[/interface/wifi/registration-table find] do={
    :local mac [/interface/wifi/registration-table get $i mac-address]
    :set currentMacs ($currentMacs , $mac)
}

# 2. Always send connect events for ALL currently connected devices (Forces sync)
:foreach mac in=$currentMacs do={
    :log info "Attendance System: Syncing connected device: $mac"
    :do {
        /tool/fetch url=$backendUrl \
            http-method=post \
            http-header-field="Content-Type:application/json,X-API-Key:$apiKey" \
            http-data="{\"eventType\":\"device-connected\",\"macAddress\":\"$mac\",\"apIdentifier\":\"$apIdentifier\",\"apMacAddress\":\"$apMac\"}" \
            keep-result=no;
    } on-error={
        :log warning "Attendance System: Failed to send sync event for $mac"
    }
}

# 3. Check for lost connections (Left) and report disconnect
:foreach mac in=$LastConnectedMacs do={
    :local idx [:find $currentMacs $mac]
    :if ([:typeof $idx] = "nil") do={
        :log info "Attendance System: Device left: $mac"
        :do {
            /tool/fetch url=$backendUrl \
                http-method=post \
                http-header-field="Content-Type:application/json,X-API-Key:$apiKey" \
                http-data="{\"eventType\":\"device-disconnected\",\"macAddress\":\"$mac\",\"apIdentifier\":\"$apIdentifier\",\"apMacAddress\":\"$apMac\"}" \
                keep-result=no;
        } on-error={
            :log warning "Attendance System: Failed to send leave event for $mac"
        }
    }
}

# 4. Heartbeat (Every run of the script - since it runs every 2 minutes)
:do {
    /tool/fetch url=$backendUrl \
        http-method=post \
        http-header-field="Content-Type:application/json,X-API-Key:$apiKey" \
        http-data="{\"eventType\":\"heartbeat\",\"macAddress\":\"$apMac\",\"apIdentifier\":\"$apIdentifier\",\"apMacAddress\":\"$apMac\"}" \
        keep-result=no;
} on-error={
    :log warning "Attendance System: Failed to send heartbeat to backend"
}

# 5. Update last connected list
:set LastConnectedMacs $currentMacs
```

---

## 🛠️ 3. خطوات التثبيت داخل الميكروتيك (WinBox / WebFig)

يمكنك إدخال هذا السكريبت وجدولته بسهولة عن طريق برنامج **WinBox** (الأداة الرسمية للتحكم بالميكروتيك):

### الخطوة 3.1: إضافة السكريبت

1. افتح برنامج **WinBox** واتصل بجهاز الميكروتيك.
2. من القائمة اليسرى، اذهب إلى **System** ثم اختر **Scripts**.
3. اضغط على زر الإضافة الأحمر **(+)** لإضافة سكريبت جديد.
4. في خانة **Name** اكتب: `attendance_monitor`.
5. في خانة **Policies**، تأكد من تفعيل صلاحيتي `read` و `write` و `test` (تكون مفعلة افتراضياً).
6. في المربع الكبير الخاص بالـ **Source**، قم بلصق السكريبت أعلاه.
7. لا تنسَ تعديل متغير الـ backendUrl بالعنوان الفعلي للابتوبك الذي استخرجته من خطوة ipconfig.
8. اضغط **Apply** ثم **OK**.

### الخطوة 3.2: جدولة تشغيل السكريبت تلقائياً

لكي يتم فحص المتصلين وتحديث الحضور كل دقيقتين:

1. من القائمة اليسرى في WinBox، اذهب إلى **System** ثم اختر **Scheduler**.
2. اضغط على زر الإضافة الأحمر **(+)**.
3. في خانة **Name** اكتب: `run_attendance_monitor`.
4. في خانة **Start Time** اختر: `startup` (لكي يبدأ العمل فور إقلاع الجهاز).
5. في خانة **Interval** اكتب: `00:02:00` (تعني كل دقيقتين).
6. في خانة **On Event** اكتب اسم السكريبت الذي قمنا بإنشائه:
   ```routeros
   /system script run attendance_monitor
   ```
7. اضغط **Apply** ثم **OK**.

---

## 🔍 4. التحقق واختبار النظام (Verification)

1. **فحص الـ Logs في الميكروتيك**:
   - من القائمة اليسرى في WinBox، اضغط على **Log**.
   - سترى رسائل تفيد بنجاح تشغيل السكريبت مثل: `Attendance System: Device joined...` أو `Attendance System: Device left...` عند اتصال هاتف أو فصله من شبكة الـ Wi-Fi الخاصة بالميكروتيك.

2. **فحص شاشة السيرفر (Backend Node.js Console)**:
   - بمجرد تشغيل السكريبت، ستلاحظ ظهور سجلات الـ Heartbeat في شاشة السيرفر كل دقيقتين (مع كل دورة فحص للسكريبت):
     ```text
     ========== [AP EVENT] ==========
     Event Type   : heartbeat
     AP Identifier: AP-101
     MAC Address  : 00:00:00:00:00:00
     Raw MAC      : 00:00:00:00:00:00
     Timestamp    : 2026-06-23T08:54:30.000Z
     ================================
     ```
   - عند اتصال أي هاتف بشبكة الـ Wi-Fi الخاصة بالميكروتيك، سيرسل السكريبت فوراً الحدث لتراه على السيرفر كالتالي:
     ```text
     ========== [AP EVENT] ==========
     Event Type   : device-connected
     AP Identifier: AP-101
     MAC Address  : XX:XX:XX:XX:XX:XX
     ...
     ```

3. **تسجيل الـ Access Point في قاعدة البيانات**:
   - تأكد من أن الـ `apIdentifier` (الذي هو `"AP-101"` في السكريبت) مُطابق للمُعرّف الخاص بالقاعة في قاعدة بياناتك (أو قم بإضافته للقاعة المطلوبة من لوحة تحكم الأدمن).

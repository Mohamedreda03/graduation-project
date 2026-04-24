# دليل النشر (Deployment Guide) - مشروع التخرج

هذا الدليل يشرح كيفية رفع وتشغيل المشروع بالكامل (Backend + Admin + Doctor) على السيرفر باستخدام Docker و GitHub Actions و Nginx.

## 1. إعداد GitHub (الخطوة الأولى)
بعد رفع الكود على GitHub، يجب إضافة البيانات السرية (Secrets) لتمكين الرفع التلقائي:
1. اذهب إلى **Settings > Secrets and variables > Actions**.
2. أضف الـ Secrets التالية:
    - `SERVER_IP`: الـ IP الخاص بالسيرفر (`16.16.218.61`).
    - `SERVER_USER`: اسم المستخدم للسيرفر (غالباً `root` أو `ubuntu`).
    - `SERVER_SSH_KEY`: مفتاح الـ SSH الخاص بالسيرفر (Private Key).

## 2. إعداد السيرفر (الخطوة الثانية)
يجب التأكد من تثبيت **Docker** و **Nginx** على السيرفر.

### أ. إعداد Nginx (الـ Host)
قم بإنشاء ملف إعدادات جديد لتوجيه النطاقات (Subdomains):
```bash
sudo nano /etc/nginx/sites-available/attendance
```
انسخ محتوى ملف `server-nginx.conf` الموجود في المشروع وضعه هناك، ثم قم بتفعيل الإعدادات:
```bash
sudo ln -s /etc/nginx/sites-available/attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### ب. إعداد مجلد المشروع
يجب أن يكون مجلد المشروع موجوداً على السيرفر في المسار المذكور في ملف الـ Workflow (مثلاً `/var/www/graduation-project`).

## 3. استخدام Subdomains (nip.io)
المشروع سيعمل تلقائياً على العناوين التالية:
- **لوحة الأدمن**: `http://att-admin.16.16.218.61.nip.io`
- **لوحة الدكتور**: `http://att-doctor.16.16.218.61.nip.io`
- **الـ API**: متاح عبر `/api` من أي من النطاقات السابقة.

## 4. أوامر الرفع الأولى (Git Commands)
إذا لم تكن قد رفعت الكود بعد، استخدم هذه الأوامر:
```bash
git add .
git commit -m "Initial deployment setup"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## 5. كيفية عمل النظام
1. عند عمل **Push** للكود، يقوم GitHub Action بالدخول للسيرفر عبر SSH.
2. يتم سحب الكود الجديد (`git pull`).
3. يتم إعادة بناء وتشغيل الـ Containers باستخدام `docker-compose.deploy.yml`.
4. يقوم Nginx الخارجي بتوجيه الزوار للـ Container المناسب بناءً على الـ Subdomain.

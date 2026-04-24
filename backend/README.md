# 🎓 Smart Attendance System — Backend

## المتطلبات

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) (لتشغيل MongoDB)

---

## 1. إعداد قاعدة البيانات (MongoDB عبر Docker)

```powershell
# تشغيل قاعدة البيانات
docker-compose up -d

# إيقاف قاعدة البيانات
docker-compose stop

# تشغيل مرة أخرى
docker-compose start

# حذف الـ container والبيانات (اختياري)
docker-compose down -v
```

---

## 2. إعداد ملف البيئة

انسخ الـ `.env` وعدّل القيم حسب بيئتك:

```bash
cp .env.example .env   # لو موجود، وإلا عدّل .env مباشرة
```

**أهم المتغيرات في `.env`:**

```env
PORT=5000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/attendance_system?authSource=admin
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
AP_API_KEY=your_access_point_api_key
```

---

## 3. تثبيت الحزم

```bash
npm install
```

---

## 4. تشغيل الـ Seed (بيانات تجريبية)

```bash
# بيانات أساسية (مستخدمين + مواد + قاعات)
npm run seed

# بيانات كاملة وأكثر تفصيلاً
node src/seeders/seed-full.js

# بيانات كبيرة (للاختبار بأحجام حقيقية)
node src/seeders/seed-large.js

# مسح كل البيانات
node src/seeders/reset.js
```

**بيانات الدخول بعد الـ seed:**

| الدور   | الإيميل                  | كلمة المرور  |
| ------- | ------------------------ | ------------ |
| Admin   | `admin@attendance.com`   | `admin123`   |
| Doctor  | `doctor1@attendance.com` | `doctor123`  |
| Student | رقم الطالب: `20210001`   | `student123` |

---

## 5. تشغيل السيرفر

```bash
# وضع التطوير (مع auto-restart)
npm run dev

# وضع الإنتاج
npm start
```

**الروابط بعد التشغيل:**

| الرابط                           | الوصف         |
| -------------------------------- | ------------- |
| `http://localhost:5000/api`      | قاعدة الـ API |
| `http://localhost:5000/api-docs` | توثيق Swagger |
| `http://localhost:5000/health`   | حالة السيرفر  |

---

## هيكل المشروع

```
backend/
├── src/
│   ├── controllers/    # منطق الطلبات
│   ├── models/         # نماذج MongoDB
│   ├── routes/         # تعريف الروابط
│   ├── middleware/     # Auth, validation, error handling
│   ├── services/       # منطق الأعمال
│   ├── seeders/        # بيانات تجريبية
│   └── utils/          # أدوات مساعدة
├── server.js           # نقطة الدخول
└── .env                # متغيرات البيئة
```

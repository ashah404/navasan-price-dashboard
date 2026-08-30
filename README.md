# 💱 داشبورد نرخ لحظه‌ای ارز و طلا | Navasan Price Dashboard

داشبورد مدرن، سریع و تعاملی برای نمایش نرخ لحظه‌ای ارزهای آزاد، طلا، سکه، حباب بازار و تحلیل روند قیمت‌ها با نمودارهای پیشرفته **Area Chart به سبک Flowbite**.

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-GitHub%20Pages-10b981?style=for-the-badge)](https://ashah404.github.io/navasan-price-dashboard/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![ApexCharts](https://img.shields.io/badge/ApexCharts-Flowbite_Style-00E396?style=for-the-badge)](https://apexcharts.com/)

---

## 🌐 مشاهده آنلاین سایت

> **🔗 آدرس وب‌سایت زنده:**  
> ### 👉 [https://ashah404.github.io/navasan-price-dashboard/](https://ashah404.github.io/navasan-price-dashboard/)

---

## ✨ امکانات و قابلیت‌های کلیدی

### 📈 ۱. نمودارهای روند قیمت (Flowbite Area Charts)
- **کارت‌های تفکیک‌شده:** نمایش نمودارهای اختصاصی برای هر نماد (دلار آمریکا، یورو، سکه امامی، طلای ۱۸ عیار و...).
- **افزودن هر نماد دلخواه:** امکان اضافه کردن چارت برای پوند، درهم امارات، لیر ترکیه، ربع سکه، نیم سکه، انس جهانی و سایر اقلام بازار.
- **انتخاب بازه‌های زمانی مختلف:** انتخاب بازه **۷ روزه**، **۱۴ روزه** و **۳۰ روزه** از طریق منوی کشویی روی هر کارت.
- **نمودار مقایسه‌ای ۳ نماد:** امکان سوئیچ به حالت تجمیعی برای مقایسه درصد رشد و افت دلار، یورو و سکه در یک قاب.

### 🗂 ۲. جدول کامل تمام ارزها با قابلیت مرتب‌سازی و جستجو
- بیش از ۱۷۰ ارز جهانی همراه با پرچم باکیفیت و رنگی هر کشور.
- **مرتب‌سازی چندحالته:**
  - 🌟 ارزهای مهم و پرکاربرد در ابتدا (پیش‌فرض)
  - 💰 بیشترین قیمت (گران‌ترین)
  - 📉 کمترین قیمت (ارزان‌ترین)
  - 🔤 مرتب‌سازی الفبایی نام فارسی (الف تا ی / ی تا الف)
  - 🔠 مرتب‌سازی بر اساس نماد انگلیسی (A تا Z)
- فیلتر و جستجوی لحظه‌ای با تایپ نام فارسی یا کد بین‌المللی.

### 🫧 ۳. محاسبه‌گر حباب سکه و طلا
- محاسبه درصد و مبلغ دقیق حباب برای سکه امامی، بهار آزادی، نیم سکه، ربع سکه، سکه گرمی و طلای آبشده.

### ⚡ ۴. عملکرد فوق‌سریع و کش هوشمند
- لود آنی صفحه بدون لودینگ طولانی با سیستم **Instant Cache Restoration**.
- بهینه‌سازی حداکثری مصرف API گیت‌هاب و کش کردن اطلاعات روزهای گذشته در مرورگر.
- به‌روزرسانی خودکار هر ۶۰ ثانیه یک‌بار + دکمه رفرش دستی.

### 🎨 ۵. رابط کاربری مدرن و واکنش‌گرا
- طراحی شیشه‌ای (Glassmorphism) تیره و چشم‌نواز.
- تایپوگرافی استاندارد با فونت زیبای **وزیرمتن (Vazirmatn)**.
- کاملاً ریسپانسیو برای تمامی نمایشگرها (موبایل، تبلت و دسکتاپ).

### 📱 ۶. پشتیبانی کامل از وب‌اپلیکیشن (PWA) و Add to Home Screen در آیفون
- اجرای تمام‌صفحه (Standalone) بدون نوار آدرس مرورگر در iOS و اندروید.
- دارای راهنمای تعاملی ۳ مرحله‌ای و بنر هوشمند نصب ویژه مرورگر Safari در آیفون.
- آیکون‌های استاندارد Apple Touch Icon و پشتیبانی از Safe Area برای ناچ آیفون.

---

## 🛠 تکنولوژی‌های استفاده‌شده

- **Frontend Core:** HTML5, Modern JavaScript (ES Modules)
- **Bundler & Build Tool:** [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts Library:** [ApexCharts](https://apexcharts.com/)
- **Typography:** [فونت وزیرمتن (Vazirmatn)](https://github.com/rastikerdar/vazirmatn)
- **CI/CD & Hosting:** GitHub Actions & GitHub Pages
- **Data Source:** [HosseinOdd/Navasan-API](https://github.com/HosseinOdd/Navasan-API)

---

## 🚀 راهنمای راه‌اندازی محلی (Local Development)

برای اجرای پروژه روی سیستم خود:

۱. کلون کردن مخزن:
```bash
git clone https://github.com/ashah404/navasan-price-dashboard.git
cd navasan-price-dashboard
```

۲. نصب وابستگی‌ها:
```bash
npm install
```

۳. اجرای سرور توسعه محلی:
```bash
npm run dev
```

۴. ساخت خروجی نهایی (Build):
```bash
npm run build
```

---

## 📄 لایسنس
این پروژه به صورت متن‌باز تحت لایسنس [MIT](LICENSE) منتشر شده است.


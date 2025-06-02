# BHMS
# 🏠 Boarding House Management System

A full-stack Boarding House Management System designed to simplify operations for landlords . Built with **TypeScript** on the frontend and **Laravel 10 (PHP)** on the backend.

---

## 🚀 Features

### 🧑‍💼 Admin/Owner Features
- Dashboard Overview: Quick stats on occupancy, payments
- Room Management: Create and manage rooms with pricing and availability.
- Tenant Management: Add, edit, or remove tenants and assign rooms.
- Payment Tracking: Manage payments, Payment history.

### 🛠️ System Features
- TypeScript Frontend: Maintainable and scalable front-end code.
- Laravel 10 Backend: RESTful API with robust security and validation.
- Activity Logging: Track user actions and system changes.
- Offline Capability:	Designed to function exclusively on desktop without requiring an internet connection, making it suitable for standalone use.

## 📦 Tech Stack
- **Frontend**: TypeScript, React
- **Backend**: Laravel 10 (PHP)
- **Database**: MySQL
- **Authentication**: Laravel Sanctum
- **API**: RESTful APIs built with Laravel

## ⚙️ Installation
donwnoad Node.js ≥v18 (https://nodejs.org/en)
prompt in cmd" npm createvite@latest
Create Project Name “fronted-app”
Select “React” for Framework
Select a Variant “TypeScript + SWC”
SWC (stands for Speedy Web Compiler)
npm install
composer install(for back end)

**Frontend (TypeScript)**
https://github.com/ChanQT/Frontend
cd Frontend
npm run dev


**database**
Download Xampp for Mysql

### Backend (Laravel)
[BHMS GitHub Repository](https://github.com/ChanQT/BHMS)
cd backend
cp .env.bhms .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
   
 **Testing**
php artisan serve(backend folder)
npm run dev (Frontend folder)





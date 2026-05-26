# MPloyChek — Background Verification SPA

A full-stack Single Page Application built with **Angular 15** and **Node.js/Express** for the MPloyChek technical assessment.

---

## 🚀 Live Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mploychek.com | password123 |
| General User | divyanshu@mploychek.com | password123 |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 15, TypeScript, RxJS, SCSS |
| Backend | Node.js, Express.js |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Database | JSON file (db.json) — no setup required |
| Architecture | REST API, Microservice-ready |

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js v16+
- Angular CLI: `npm install -g @angular/cli`

### 1. Backend
```bash
cd backend
npm install
node server.js
# Runs at http://localhost:3000
```

### 2. Frontend
```bash
cd frontend
npm install
ng serve
# Runs at http://localhost:4200
```

---

## ✨ Features

### 🔐 Login Page
- Reactive form with validation (email, password, role)
- JWT token stored in localStorage
- Role-based redirect after login
- Quick-fill buttons for easy testing

### 📊 Dashboard (All Users)
- User profile card — name, department, join date, status
- Stats row — Total / Verified / In Progress / Failed counts
- Verification records table with search & filter
- **Role-based data access** — General User sees only their records, Admin sees all
- **Async API delay demo** — set delay (0–5000ms), click Reload to see async processing with live spinner and load time reporting

### 👑 Admin Panel (Admin only)
- Full CRUD — Create, Read, Update, Delete users
- Create/Edit user modal with form validation
- Delete confirmation dialog
- Cannot delete own account (safety guard)
- Protected by AdminGuard — non-admins are redirected

---

## 🏗️ Project Structure

```
mploychek-app/
├── backend/
│   ├── server.js        ← Express API
│   ├── db.json          ← JSON database
│   └── package.json
└── frontend/
    └── src/
        └── app/
            ├── components/
            │   ├── login/       ← Login page
            │   ├── dashboard/   ← Main dashboard
            │   └── admin/       ← User management
            ├── services/
            │   ├── auth.service.ts   ← JWT + BehaviorSubject
            │   └── user.service.ts   ← API calls
            ├── guards/
            │   └── auth.guard.ts     ← AuthGuard + AdminGuard
            ├── interceptors/
            │   └── auth.interceptor.ts ← JWT attach + 401 handler
            └── models/
                └── models.ts         ← TypeScript interfaces
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | None | Login, returns JWT |
| GET | /api/auth/me | Bearer | Get current user profile |
| GET | /api/records | Bearer | Records (role-filtered) |
| GET | /api/users | Admin | List all users |
| POST | /api/users | Admin | Create user |
| PUT | /api/users/:id | Admin | Update user |
| DELETE | /api/users/:id | Admin | Delete user |

> All endpoints support `?delay=<ms>` query param to simulate API latency (async processing demo).

---

## 🎯 Assessment Criteria Coverage

| Criteria | Implementation |
|----------|---------------|
| Angular Framework | Angular 15, Reactive Forms, RxJS, Route Guards |
| API Knowledge | RESTful Express API, JWT Auth, HTTP Interceptor |
| Cloud Framework | AWS-ready architecture, modular services |
| UI Design | Custom SCSS design system, MPloyChek brand colors |
| Clean Code | Separation of concerns — services, guards, interceptors, models |
| Async Processing | `?delay` param + Observable + loading spinner demo |
| Role-based Access | Admin vs General User — data & route level |

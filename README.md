# Shift Management System

A two-part application for creating, viewing, editing, and deleting user shifts.\
– **Frontend:** React + Tailwind, with form validation, table & calendar views\
– **Backend:** Node.js + Express + MongoDB, documented with Swagger, full CRUD REST API and unit tests

---

## 📝 Overview

This exercise extends an existing Shift Management System by adding full CRUD support on both the client and the server:

- **Users** can create shifts with title, date/time, role, and location
- **Dashboard** lists upcoming and in-progress shifts; **Details** page shows full info
- **Calendar** view highlights all shifts by date
- **Edit / Delete** from the UI with confirmation flows

---

## 🚀 Features

- **Full CRUD**: Create, Read, Update, Delete shifts
- **Form validation**: React Hook Form + Yup
- **API integration**: Axios with token injection and error‑toasts
- **Views**: Table and Calendar for easy navigation
- **Swagger docs**: Interactive API docs for every route
- **Unit tests**: Jest + Supertest (backend); React Testing Library (frontend)

---

## 🔧 Prerequisites

- **Node.js** v16+ & **npm**
- **MongoDB** connection (Atlas or local)

---

## ⚙️ Setup & Run

### 1. Existing User Credentials

Use the following user to log in and view preloaded shifts (dashboard, shift details, edit/delete):

```text
email: "john@example.com"
password: "StrongPass123!"
```

### 2. Clone Repositories

```bash
git clone https://github.com/nishanth-abishek/orta-dev-test-fe.git
git clone https://github.com/nishanth-abishek/orta-dev-test-be.git

cd orta-dev-test-be
git checkout feature/shift-crud
cd ..
cd orta-dev-test-fe
git checkout feature/shift-crud
```

### 3. Install Dependencies

```bash
# Frontend
dd orta-dev-test-fe && npm install
# Backend
cd orta-dev-test-be && npm install
```

### 4. Environment Configuration

- **Frontend**: create `.env.local` in `orta-dev-test-fe`

  ```env
  REACT_APP_BACKEND_URL_LOCAL=http://localhost:8000
  REACT_APP_BACKEND_URL_PROD=https://orta-dev-test-be.onrender.com
  REACT_APP_ENVIRONMENT=development
  ```

- **Backend**: create `.env` in `orta-dev-test-be`

  ```env
  MONGO_URI=<secret>
  PORT=8000
  JWT_SECRET=secret1234
  NODE_ENV=development
  ```

### 5. Running Locally

- **Frontend**

  ```bash
  cd orta-dev-test-fe
  npm start    # http://localhost:3000
  ```

  - Verify login with the existing user, test dashboard, create/edit/delete flows.

- **Backend**

  ```bash
  cd orta-dev-test-be
  npm run dev  # http://localhost:8000
  ```

  - Open Swagger UI at [http://localhost:8000/api/docs](http://localhost:8000/api/docs) to explore and test API endpoints.

---

## 🏗️ Architecture

### Backend Architecture

- **Express** for routing
- **Mongoose** models (`User`, `Location`, `Shift`)
- **Controllers** contain business logic; **Routes** map HTTP verbs
- **Swagger** via `swagger-jsdoc` & `swagger-ui-express` at `/api/docs`
- **Testing** with Jest & Supertest in `tests/`

### Frontend Architecture

- **Pages / Components**:
  - `CreateShift.jsx`, `EditShift.jsx`
  - `Shifts.jsx` (dashboard + calendar)
  - `ShiftDetails.jsx`
- **Forms**: React Hook Form + Yup
- **HTTP**: Axios instance with auth header interceptor
- **Context**: `TokenContext` for user session
- **Styling**: Tailwind CSS
- **Calendar**: react-calendar
- **Testing**: React Testing Library & Jest

---

## 📑 Swagger Documentation

All backend endpoints are fully documented and available at:

```
http://localhost:8000/api/docs
```


---

## ✅ Testing

Run tests in both repos:

```bash
# Backend
cd orta-dev-test-be
npm test    # Jest + coverage

# Frontend
cd orta-dev-test-fe
npm test    # React Testing Library
```

---

## Assumptions & Trade-offs

- **No full authentication flow** on the API—JWT checks are stubbed; there are no signup or password‐reset endpoints
- **Client-side geolocation** used for distance calculations; requires user permission in the browser
- **Error handling** is basic - only console errors for create & edit shift pages
- **Tests** cover core user flows but not 100% of edge cases, like race conditions, etc.

---

## Demo Video

The walkthrough is available here:

> **Demo link:** []

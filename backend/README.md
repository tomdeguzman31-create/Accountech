# AccounTech Backend API (MongoDB)

Backend service for the AccounTech Integrated Informatics Ecosystem (PHINMA AU - CMA), now running on MongoDB.

## Stack

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT authentication + role-based access
- Bcrypt hashing for passwords and OTPs
- Document parser support for `.docx` and `.pdf`

## Core Features Implemented

- Filtered student registration using whitelist collection
- OTP-based account activation
- Login for `ADMIN`, `FACULTY`, `STUDENT`
- Password reset OTP flow
- Subject management (CRUD, role-protected)
- Student whitelist management (list, bulk enroll, remove)
- Question bank management (single and bulk insert)
- Adaptive drill generation and submission
- Student analytics (`/api/analytics/me`)
- Dean/faculty overview analytics (`/api/analytics/overview`)
- Question-bank parser endpoint (`/api/parser/question-bank`)

## Setup

You can run backend commands from either:

- `CMA-capstone/backend` directly, or
- `CMA-capstone` root using `npm run <script> --prefix backend`.

1. Install dependencies

```bash
cd backend
npm install
```

2. Configure environment variables

```bash
copy .env.example .env
```

3. Ensure MongoDB is running and update `MONGO_URI` in `.env`

4. Seed initial data

```bash
npm run seed
```

5. Run development server

```bash
npm run dev
```

From workspace root:

```bash
npm run dev:backend
```

Server default: `http://localhost:4000`

## API Summary

### Auth

- `POST /api/auth/request-otp`
- `POST /api/auth/activate`
- `POST /api/auth/request-reset-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me/profile`
- `PUT /api/auth/me/password`
- `POST /api/auth/staff` (ADMIN only)

### Students (Whitelist)

- `GET /api/students` (ADMIN/FACULTY)
- `POST /api/students/bulk` (ADMIN/FACULTY)
- `DELETE /api/students/:studentId` (ADMIN/FACULTY)

### Subjects

- `GET /api/subjects`
- `POST /api/subjects` (ADMIN)
- `PUT /api/subjects/:id` (ADMIN)
- `DELETE /api/subjects/:id` (ADMIN)

### Questions

- `GET /api/questions?subjectId=&difficulty=`
- `POST /api/questions` (ADMIN/FACULTY)
- `POST /api/questions/bulk` (ADMIN/FACULTY)

### Drills

- `POST /api/drills/session` (STUDENT)
- `POST /api/drills/submit` (STUDENT)

### Analytics

- `GET /api/analytics/me` (STUDENT)
- `GET /api/analytics/overview` (ADMIN/FACULTY)

### Parser

- `POST /api/parser/question-bank` (multipart form-data, key: `file`, ADMIN/FACULTY)

## Notes for Production

- Replace OTP response echo with real email delivery (institutional SMTP).
- Add rate limiting and request validation middleware.
- Add audit logging for admin/faculty actions.

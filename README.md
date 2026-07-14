# Accountech

<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h1>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>

## System Flow (End-to-End)

### Architecture Flow

```mermaid
flowchart LR
  %% Client
  subgraph Browser[Frontend (Vite + React)]
    UI[Pages (Admin/Faculty/Student)] --> App[App session state + role routing]
    App --> API[services/api.ts fetch wrapper]
  end

  %% Transport
  API -->|HTTP JSON + Bearer JWT| Express[Backend (Express API)]

  %% Backend
  subgraph Server[Backend (Node + Express + TS)]
    Express --> MW[Middleware: requireAuth + requireRoles]
    MW --> Routes[Route Modules (/api/*)]
    Routes --> Auth[/auth: OTP + login + me/]
    Routes --> Students[/students: whitelist + assign content/]
    Routes --> Subjects[/subjects: catalog/]
    Routes --> Questions[/questions: question bank/]
    Routes --> Drills[/drills: session + submit/]
    Routes --> Analytics[/analytics: progress + reports + leaderboard/]
    Routes --> Announcements[/announcements: post + list/]
    Routes --> Parser[/parser: doc/pdf extraction/]

    Auth --> Models[Mongoose Models]
    Students --> Models
    Subjects --> Models
    Questions --> Models
    Drills --> Models
    Analytics --> Models
    Announcements --> Models
  end

  %% Data
  Models --> Mongo[(MongoDB)]
  Mongo --- C1[User]
  Mongo --- C2[AllowedStudent (whitelist)]
  Mongo --- C3[Subject]
  Mongo --- C4[Question]
  Mongo --- C5[ExamAssignment]
  Mongo --- C6[DrillSession]
  Mongo --- C7[DrillResponse]
  Mongo --- C8[Announcement]

  %% External
  Auth -->|Send OTP| Email[SendGrid / SMTP]
  Parser -->|Extract raw text| FileParsing[mammoth (.docx) / pdf-parse (.pdf)]
```

### Typical Student Drill Sequence

```mermaid
sequenceDiagram
  participant U as Student (Browser)
  participant FE as Frontend (React)
  participant BE as Backend (Express)
  participant DB as MongoDB

  U->>FE: Sign in
  FE->>BE: POST /api/auth/login (email, password)
  BE->>DB: Find User + verify bcrypt
  DB-->>BE: User
  BE-->>FE: { token, user }
  FE-->>U: Session activated (token saved)

  U->>FE: Start Drill (subject + tier)
  FE->>BE: POST /api/drills/session (Bearer token)
  BE->>DB: Compute adaptive difficulty from DrillSession
  BE->>DB: Sample Questions (subject + difficulty)
  DB-->>BE: Questions
  BE-->>FE: Drill payload

  U->>FE: Submit answers
  FE->>BE: POST /api/drills/submit (answers)
  BE->>DB: Insert DrillResponses + create DrillSession
  DB-->>BE: OK
  BE-->>FE: Score + status + remedials
  FE-->>U: Show results; return to dashboard
```

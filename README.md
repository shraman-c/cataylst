# Catalyst: AI-Powered Timetable Generator

Catalyst is a modern, full-stack web application for generating, visualizing, and managing academic timetables using AI (Genetic Algorithm + LLM-powered summaries). It supports admin, teacher, and student roles, real-time conflict detection, and change requests—all with a beautiful, responsive UI.

---

## Features

- **AI Timetable Generation:** Uses a genetic algorithm to create conflict-free timetables for schools/colleges.
- **Data Upload:** Import students, teachers, rooms, and courses from CSV files.
- **Personalized Views:** Teachers and students get their own filtered schedules.
- **Conflict Detection:** Real-time highlighting of timetable conflicts.
- **Change Requests:** Teachers/students can request changes; admins can approve/reject.
- **Manual Edits:** Admins can manually adjust slots and resolve conflicts.
- **Modern UI:** Built with Next.js, Tailwind, and Radix UI for a clean, responsive experience.
- **Supabase Backend:** All data is stored in a Supabase PostgreSQL database.
- **Custom Auth System:** Secure bcrypt password hashing and JWT session management.
- **Genkit AI Flows:** LLM-powered summaries and reasoning for timetable explanations.

---

## Tech Stack

- **Frontend:** Next.js 15, React 18, Tailwind CSS, Radix UI, TypeScript
- **Backend:** Next.js API routes, Supabase (PostgreSQL), `pg` driver, Zod validation
- **Auth:** Custom bcrypt + JWT implementation
- **AI/ML:** Custom genetic algorithm, Genkit LLM flows
- **Other:** PapaParse (CSV), jsonwebtoken

---

## Folder Structure

```text
src/
  app/                # Next.js app directory (pages, API routes, layouts)
     api/              # API endpoints (data, auth, timetable, requests)
     dashboard/        # Main dashboard UI (admin/teacher/student views)
     login/            # Login page
     register/         # Registration page
     components/       # UI components (dashboard, tables, dialogs, etc.)
  lib/                # Shared logic (types, schemas, utils, genetic algorithm)
  server/             # Supabase connection and helpers (using pg pool)
  ai/                 # Genkit LLM flows and dev scripts
  docs/                 # Project blueprints and documentation
  public/               # Static assets (images, favicon)
.env                  # Environment variables
```

---

## Setup & Running Locally

For detailed installation and database setup instructions, please refer to the **[Setup Guide](setup.md)**.

**Quick Start:**
1. Install dependencies: `npm install`
2. Configure `.env` as per `setup.md`.
3. Run the app: `npm run dev` (runs at `http://localhost:9002`)

---

## Required environment variables

- `DATABASE_URL`
- `DB_PROVIDER`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `NEXTAUTH_URL`

---

## Usage

### Admin
- Upload CSVs for students, teachers, rooms, and courses.
- Generate timetable (AI-powered) and review conflicts.
- Manually edit slots or resolve conflicts.
- Approve/reject change requests from teachers/students.

### Teacher/Student
- Log in to see your personalized timetable.
- Request changes to your schedule if needed.

---

## Architecture

- **API routes** handle CRUD for all entities and timetable generation.
- **Genetic algorithm** (see `src/lib/genetic-algorithm.ts`) creates optimal timetables.
- **Supabase (PostgreSQL)** stores all data via a connection pool.
- **JWT-based auth** for secure login and session management.
- **LLM/Genkit** (optional) for advanced summaries and explanations.

---

## Deployment

### Deploy to Netlify / Vercel
1. Connect your repository to the platform.
2. Set the environment variables in the platform's dashboard.
3. Use build command: `npm run build` and publish directory: `.next`.

---

## Contributing    
  1. Fork this repo and clone your fork.
  2. Create a new branch for your feature/fix.
  3. Make your changes and add tests if needed.
  4. Run `npm run lint` and `npm run typecheck` to ensure code quality.
  5. Commit and push, then open a pull request.

---
## License
MIT License. See [LICENSE](LICENSE) for details.



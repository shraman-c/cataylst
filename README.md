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
- **Supabase Backend:** All data is stored in a Supabase PostgreSQL database with real-time capabilities.
- **Genkit AI Flows:** LLM-powered summaries and reasoning for timetable explanations.

---

## Tech Stack

- **Frontend:** Next.js 15, React 18, Tailwind CSS, Radix UI, TypeScript
- **Backend:** Next.js API routes, Supabase (PostgreSQL), Zod validation
- **AI/ML:** Custom genetic algorithm, Genkit LLM flows
- **Other:** PapaParse (CSV), jose (JWT), Socket.IO (for real-time, optional)

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
  server/             # Supabase connection and helpers
  ai/                 # Genkit LLM flows and dev scripts
docs/                 # Project blueprints and documentation
.env                  # Environment variables (Supabase URL, JWT secret, etc.)
```

---

## Setup & Running Locally

1. **Install dependencies:**

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
    - **Supabase Backend:** All data is stored in a Supabase PostgreSQL database with real-time capabilities.
    - **Genkit AI Flows:** LLM-powered summaries and reasoning for timetable explanations.

    ---

    ## Tech Stack

    - **Frontend:** Next.js 15, React 18, Tailwind CSS, Radix UI, TypeScript
    - **Backend:** Next.js API routes, Supabase (PostgreSQL), Zod validation
    - **AI/ML:** Custom genetic algorithm, Genkit LLM flows
    - **Other:** PapaParse (CSV), jose (JWT), Socket.IO (for real-time, optional)

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
      server/             # Supabase connection and helpers
      ai/                 # Genkit LLM flows and dev scripts
    docs/                 # Project blueprints and documentation
    public/               # Static assets (images, favicon)
    .env                  # Environment variables (REDACTED in repo; use `.env.example`)
    ```

    ---

    ## Setup & Running Locally

    1. **Install dependencies:**

        ```bash
        npm install
        ```

    2. **Configure environment:**
        - Copy `.env.example` to `.env` (or create `.env`) and fill in the values. Required variables:
          - `SUPABASE_URL` (your Supabase project URL)
          - `SUPABASE_ANON_KEY` (anon/public key)
          - `SUPABASE_SERVICE_ROLE_KEY` (service role key — keep secret)
          - `NEXTAUTH_SECRET` (NextAuth secret)
          - `NEXTAUTH_URL` (URL for your dev server, e.g. `http://localhost:9002`)

        Note: This repository has had secrets redacted from `.env`. Do NOT commit real secret values — use `.env` locally and CI secret management in your deployment platform.

    3. **Set up Supabase database:**
        - Create a new Supabase project at https://supabase.com
        - Run the provided SQL files inside Supabase SQL editor (e.g., `create-database-schema.sql`, `setup-sample-data.sql`) to create tables and seed sample data.

    4. **Run the Next.js app:**

        ```powershell
        npm run dev
        # App runs at http://localhost:9002
        ```

    5. **Build for production:**

        ```powershell
        npm run build
        npm run start
        ```

    6. **(Optional) Run Genkit AI flows:**

        ```bash
        npm run genkit:watch
        ```

    ---

    ## Recent fixes & security notes (Sept 2025)

    - Server-side rendering error: Fixed a ReferenceError during prerendering of `/dev` caused by direct `window` access. The page now uses a client-only effect to read `window.innerWidth` (`src/app/dev/page.tsx`).
    - Secrets redaction: Repository `.env` was redacted to remove secret values. If you previously pushed secrets, rotate them immediately in Supabase and any providers used.
    - Hardcoded keys removed: Scripts that previously included fallback hardcoded supabase keys now require the corresponding environment variables (no secret defaults in code).
    - Favicon: The project now includes a favicon at `public/favicon.png` and the layout references it.

    Security recommendations:

    - Rotate any keys that may have been exposed.
    - Use your deployment platform's secret manager (Netlify, Vercel, GitHub Actions secrets) instead of committing `.env`.
    - If secrets were previously committed to git history, consider scrubbing them from history (BFG or git-filter-repo) before pushing and then rotate keys.

    ---

    ## Required environment variables

    - SUPABASE_URL
    - SUPABASE_ANON_KEY
    - SUPABASE_SERVICE_ROLE_KEY
    - NEXTAUTH_SECRET
    - NEXTAUTH_URL

    These are required for local development and CI; keep them secret and provide them via your platform's secret manager in production.

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
- **Supabase** stores all data (students, teachers, rooms, courses, timetables, change requests).
- **JWT-based auth** for secure login and session management.
- **LLM/Genkit** (optional) for advanced summaries and explanations.

---

## Deployment

### Deploy to Netlify (Recommended)

Catalyst can be easily deployed to Netlify with either Supabase or Neon (Netlify's serverless Postgres).

#### Quick Deploy with Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and initialize
netlify login
netlify init

# Set environment variables
netlify env:set SUPABASE_URL "your_supabase_url"
netlify env:set SUPABASE_ANON_KEY "your_anon_key"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_key"
netlify env:set NEXTAUTH_SECRET "your_nextauth_secret"
netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
netlify env:set JWT_SECRET "your_jwt_secret"

# Deploy
netlify deploy --prod
```

#### Deploy with Netlify Dashboard:

1. **Connect Repository:**
   - Go to https://app.netlify.com
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub/GitLab/Bitbucket repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - The project includes a `netlify.toml` with optimal configuration

3. **Set Environment Variables:**
   - Go to Site settings > Environment variables
   - Add all required variables from `.env.example`

4. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be live at `https://[site-name].netlify.app`

### Migrating to Neon (Netlify Postgres)

Want to use Neon instead of Supabase for better Netlify integration? See **[NEON_MIGRATION.md](./NEON_MIGRATION.md)** for a complete migration guide.

Benefits of Neon:
- Serverless Postgres with auto-scaling
- Better integration with Netlify
- Database branching for preview deployments
- Pay-per-use pricing model

### Deploy to Vercel

Catalyst also works great on Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
# Or use: vercel env add
```

### Deploy to Other Platforms

The app is a standard Next.js application and can be deployed to:
- AWS (Amplify, EC2, ECS)
- Google Cloud (Cloud Run, App Engine)
- Azure (App Service, Container Instances)
- Self-hosted (Docker, PM2, etc.)

For self-hosting, build the app and run:
```bash
npm run build
npm run start
```
Testing out the Online version
goto: https://cataylst.vercel.app/login/emp-login/
```bash
username: admin
password: admin123
```
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

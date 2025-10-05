# 🚀 Catalyst NEP Features Setup Guide

Your updates aren't reflecting because you need to complete the database setup. Follow these steps:

## Step 1: Run Database Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Catalyst project
   - Click "SQL Editor" in the left sidebar

2. **Execute Migration**
   - Click "New Query"
   - Copy the entire content from `minimal-migration.sql`
   - Paste into the SQL editor
   - Click "Run"
   - You should see success messages like "Added is_nep column to courses table"

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**To find these values:**
1. In Supabase Dashboard → Settings → API
2. Copy "Project URL" as SUPABASE_URL
3. Copy "anon public" key as SUPABASE_ANON_KEY
4. Copy "service_role" key as SUPABASE_SERVICE_ROLE_KEY

## Step 3: Restart Development Server

After setting up the environment variables:
```bash
npm run dev
```

## Step 4: Test the New Features

Once everything is set up, you should see:

✅ **Students Table**: New "Program ID" and "Current Semester" columns
✅ **Courses Table**: Editable NEP status and course type fields
✅ **Filter Buttons**: "NEP Courses" and "Non-NEP Courses" buttons
✅ **NEP Course Types**: Dropdown with all 10 NEP categories:
   - Major, Minor, MDC, AEC, SEC, VAC, OEC, IDC, FC, LC

## Troubleshooting

If updates still don't reflect:
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Ensure migration ran successfully in Supabase
4. Restart the development server after env setup

## What the Migration Adds

The database migration adds these columns:
- `courses.is_nep` (boolean) - Identifies NEP courses
- `courses.nep_course_type` (text) - NEP course category
- `students.program_id` (text) - Student's academic program
- `students.current_semester` (integer) - Current semester number

Once completed, your Catalyst dashboard will have full NEP compliance and enhanced student tracking! 🎓
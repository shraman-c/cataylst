# Catalyst Setup Guide

This guide provides the complete steps to set up the database and environment for the Catalyst Academic Management System.

## 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database connection (Supabase Transaction Pooler port 6543)
DATABASE_URL=your_supabase_connection_string
DB_PROVIDER=supabase

# Supabase API Keys
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Custom Authentication
JWT_SECRET=your_random_32_character_secret_key
NEXTAUTH_URL=http://localhost:9002
```

## 2. Database Schema Setup

Run the following SQL commands in the **Supabase SQL Editor** to set up the custom authentication and application tables.

### Part A: Core Tables & Enums
```sql
-- 1. Create Role Enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

-- 2. Create Users Table (Custom Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. Academic Tables
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    total_semesters INTEGER NOT NULL DEFAULT 8,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    program_id TEXT NOT NULL,
    current_semester INTEGER NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 8),
    electives JSONB DEFAULT '[]',
    credits INTEGER DEFAULT 0,
    enrolled_courses JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    teacher_id TEXT UNIQUE NOT NULL,
    subjects JSONB DEFAULT '[]',
    availability JSONB DEFAULT '{}',
    designation TEXT CHECK (designation IN ('Dean', 'HOD', 'Professor', 'Associate Professor', 'Assistant Professor')),
    qualification TEXT,
    working_hours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    credits INTEGER NOT NULL,
    classes_per_week INTEGER NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE,
    semester INTEGER NOT NULL DEFAULT 1 CHECK (semester >= 1 AND semester <= 8),
    is_nep BOOLEAN DEFAULT FALSE,
    nep_course_type TEXT CHECK (nep_course_type IN ('Major', 'Minor', 'MDC', 'AEC', 'SEC', 'VAC', 'OEC', 'IDC', 'FC', 'LC')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    day TEXT NOT NULL,
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    course_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    requester_id TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    slot_id TEXT NOT NULL,
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Part B: Constraints & Indexes
```sql
-- Constraints
ALTER TABLE courses ADD CONSTRAINT chk_nep_course_type_consistency 
    CHECK ((is_nep = false AND nep_course_type IS NULL) OR (is_nep = true));

ALTER TABLE timetables ADD CONSTRAINT chk_valid_time_format 
    CHECK (time_start ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' AND time_end ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE timetables ADD CONSTRAINT chk_valid_day 
    CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

### Part C: Security & RLS
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- Basic "Allow All" policies for initial setup
-- In production, replace these with strict role-based policies
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on programs" ON programs FOR ALL USING (true);
CREATE POLICY "Allow all on students" ON students FOR ALL USING (true);
CREATE POLICY "Allow all on teachers" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all on courses" ON courses FOR ALL USING (true);
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true);
CREATE POLICY "Allow all on timetables" ON timetables FOR ALL USING (true);
CREATE POLICY "Allow all on change_requests" ON change_requests FOR ALL USING (true);
```

## 3. Initial Admin Setup

Once the database is ready, register a user through the frontend `/register` page, then promote them to admin using this SQL:

```sql
UPDATE users 
SET role = 'admin' 
WHERE username = 'your_registered_username';
```

## 4. Local Execution

1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Access app: `http://localhost:9002`

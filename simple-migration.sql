-- Simple Migration Commands for Supabase
-- Run these one by one in Supabase SQL Editor if you prefer step-by-step approach

-- 1. Add missing columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_nep BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS nep_course_type TEXT CHECK (nep_course_type IN ('Major', 'Minor', 'MDC', 'AEC', 'SEC', 'VAC', 'OEC', 'IDC', 'FC', 'LC'));

-- 2. Add missing columns to students table  
ALTER TABLE students ADD COLUMN IF NOT EXISTS program_id TEXT NOT NULL DEFAULT 'default-program';
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_semester INTEGER NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 8);

-- 3. Add constraint for NEP consistency
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS chk_nep_course_type_consistency 
    CHECK ((is_nep = false AND nep_course_type IS NULL) OR (is_nep = true));

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_is_nep ON courses(is_nep);
CREATE INDEX IF NOT EXISTS idx_courses_nep_course_type ON courses(nep_course_type);
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_current_semester ON students(current_semester);

-- 5. Drop existing problematic views
DROP VIEW IF EXISTS course_details;
DROP VIEW IF EXISTS student_details;
DROP VIEW IF EXISTS timetable_details;

-- 6. Recreate course_details view
CREATE OR REPLACE VIEW course_details AS
SELECT 
    c.id,
    c.custom_id as course_code,
    c.name as course_name,
    c.credits,
    c.semester,
    c.is_nep,
    c.nep_course_type,
    c.created_at,
    c.updated_at,
    CASE 
        WHEN c.is_nep = true THEN 'NEP Course'
        ELSE 'Non-NEP Course'
    END as course_category
FROM courses c;

-- 7. Recreate student_details view
CREATE OR REPLACE VIEW student_details AS
SELECT 
    s.id,
    s.student_id,
    s.name,
    s.program_id,
    s.current_semester,
    s.created_at,
    s.updated_at,
    CASE 
        WHEN s.current_semester <= 8 THEN 'Active'
        WHEN s.current_semester > 8 THEN 'Completed'
        ELSE 'Unknown'
    END as student_status
FROM students s;

-- 8. Verify the changes
SELECT 'Migration completed!' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name IN ('is_nep', 'nep_course_type');
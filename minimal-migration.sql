-- SIMPLE Supabase Migration Script
-- Run this to safely add only the essential NEP columns

-- =====================================
-- STEP 1: ADD MISSING COLUMNS
-- =====================================

-- Add NEP columns to courses table
DO $$
BEGIN
    -- Add is_nep column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_nep') THEN
        ALTER TABLE courses ADD COLUMN is_nep BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_nep column to courses table';
    END IF;
    
    -- Add nep_course_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'nep_course_type') THEN
        ALTER TABLE courses ADD COLUMN nep_course_type TEXT;
        RAISE NOTICE 'Added nep_course_type column to courses table';
    END IF;
END $$;

-- Add student tracking columns
DO $$
BEGIN
    -- Add program_id column to students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'program_id') THEN
        ALTER TABLE students ADD COLUMN program_id TEXT DEFAULT 'default-program';
        RAISE NOTICE 'Added program_id column to students table';
    END IF;
    
    -- Add current_semester column to students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'current_semester') THEN
        ALTER TABLE students ADD COLUMN current_semester INTEGER DEFAULT 1;
        RAISE NOTICE 'Added current_semester column to students table';
    END IF;
END $$;

-- =====================================
-- STEP 2: ADD CONSTRAINTS
-- =====================================

-- Add constraint for NEP course types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nep_course_types') THEN
        ALTER TABLE courses ADD CONSTRAINT chk_nep_course_types 
            CHECK (nep_course_type IN ('Major', 'Minor', 'MDC', 'AEC', 'SEC', 'VAC', 'OEC', 'IDC', 'FC', 'LC') OR nep_course_type IS NULL);
        RAISE NOTICE 'Added NEP course types constraint';
    END IF;
END $$;

-- Add constraint for semester range
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_semester_range') THEN
        ALTER TABLE students ADD CONSTRAINT chk_semester_range 
            CHECK (current_semester >= 1 AND current_semester <= 8);
        RAISE NOTICE 'Added semester range constraint';
    END IF;
END $$;

-- =====================================
-- STEP 3: ADD INDEXES
-- =====================================

CREATE INDEX IF NOT EXISTS idx_courses_is_nep ON courses(is_nep);
CREATE INDEX IF NOT EXISTS idx_courses_nep_course_type ON courses(nep_course_type);
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_current_semester ON students(current_semester);

-- =====================================
-- STEP 4: VERIFICATION
-- =====================================

-- Verify the migration
SELECT 'Migration completed successfully!' as status;

-- Show the new columns
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('courses', 'students') 
AND column_name IN ('is_nep', 'nep_course_type', 'program_id', 'current_semester')
ORDER BY table_name, column_name;

-- Test the new columns
SELECT 'Testing courses table...' as test;
SELECT COUNT(*) as total_courses, 
       COUNT(CASE WHEN is_nep = true THEN 1 END) as nep_courses,
       COUNT(CASE WHEN is_nep = false THEN 1 END) as non_nep_courses
FROM courses;

SELECT 'Testing students table...' as test;
SELECT COUNT(*) as total_students,
       COUNT(DISTINCT program_id) as distinct_programs,
       AVG(current_semester) as avg_semester
FROM students;
-- Supabase Migration Script
-- Run this to update existing database with new NEP columns and student fields

-- =====================================
-- STEP 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================

-- Add NEP columns to courses table if they don't exist
DO $$
BEGIN
    -- Add is_nep column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_nep') THEN
        ALTER TABLE courses ADD COLUMN is_nep BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_nep column to courses table';
    ELSE
        RAISE NOTICE 'is_nep column already exists in courses table';
    END IF;
    
    -- Add nep_course_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'nep_course_type') THEN
        ALTER TABLE courses ADD COLUMN nep_course_type TEXT CHECK (nep_course_type IN ('Major', 'Minor', 'MDC', 'AEC', 'SEC', 'VAC', 'OEC', 'IDC', 'FC', 'LC'));
        RAISE NOTICE 'Added nep_course_type column to courses table';
    ELSE
        RAISE NOTICE 'nep_course_type column already exists in courses table';
    END IF;
END $$;

-- Add student program tracking columns if they don't exist
DO $$
BEGIN
    -- Add program_id column to students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'program_id') THEN
        ALTER TABLE students ADD COLUMN program_id TEXT NOT NULL DEFAULT 'default-program';
        RAISE NOTICE 'Added program_id column to students table';
    ELSE
        RAISE NOTICE 'program_id column already exists in students table';
    END IF;
    
    -- Add current_semester column to students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'current_semester') THEN
        ALTER TABLE students ADD COLUMN current_semester INTEGER NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 8);
        RAISE NOTICE 'Added current_semester column to students table';
    ELSE
        RAISE NOTICE 'current_semester column already exists in students table';
    END IF;
END $$;

-- =====================================
-- STEP 2: ADD CONSTRAINTS SAFELY
-- =====================================

-- Add NEP course type consistency constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_nep_course_type_consistency') THEN
        ALTER TABLE courses ADD CONSTRAINT chk_nep_course_type_consistency 
            CHECK ((is_nep = false AND nep_course_type IS NULL) OR (is_nep = true));
        RAISE NOTICE 'Added NEP course type consistency constraint';
    ELSE
        RAISE NOTICE 'NEP course type consistency constraint already exists';
    END IF;
END $$;

-- =====================================
-- STEP 3: ADD INDEXES FOR NEW COLUMNS
-- =====================================

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_current_semester ON students(current_semester);
CREATE INDEX IF NOT EXISTS idx_courses_is_nep ON courses(is_nep);
CREATE INDEX IF NOT EXISTS idx_courses_nep_course_type ON courses(nep_course_type);

-- =====================================
-- STEP 4: DROP EXISTING VIEWS SAFELY
-- =====================================

-- Drop views if they exist (they'll be recreated properly)
DROP VIEW IF EXISTS course_details;
DROP VIEW IF EXISTS student_details;
DROP VIEW IF EXISTS timetable_details;

-- =====================================
-- STEP 5: RECREATE VIEWS WITH CORRECT COLUMN REFERENCES
-- =====================================

-- View for course details with complete information
CREATE OR REPLACE VIEW course_details AS
SELECT 
    c.id,
    c.custom_id as course_code,
    c.name as course_name,
    c.credits,
    c.is_nep,
    c.nep_course_type,
    c.created_at,
    c.updated_at,
    CASE 
        WHEN c.is_nep = true THEN 'NEP Course'
        ELSE 'Non-NEP Course'
    END as course_category,
    CASE 
        WHEN c.nep_course_type = 'Major' THEN 'Major Core'
        WHEN c.nep_course_type = 'Minor' THEN 'Minor'
        WHEN c.nep_course_type = 'MDC' THEN 'Multi-Disciplinary Course'
        WHEN c.nep_course_type = 'AEC' THEN 'Ability Enhancement Course'
        WHEN c.nep_course_type = 'SEC' THEN 'Skill Enhancement Course'
        WHEN c.nep_course_type = 'VAC' THEN 'Value Added Course'
        WHEN c.nep_course_type = 'OEC' THEN 'Open Elective Course'
        WHEN c.nep_course_type = 'IDC' THEN 'Inter-Disciplinary Course'
        WHEN c.nep_course_type = 'FC' THEN 'Foundation Course'
        WHEN c.nep_course_type = 'LC' THEN 'Language Course'
        ELSE 'Regular Course'
    END as nep_type_description
FROM courses c;

-- View for student details with program information
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

-- Simplified timetable view (without joins to avoid missing table issues)
CREATE OR REPLACE VIEW timetable_details AS
SELECT 
    t.id,
    t.course_id,
    t.teacher_id,
    t.room_id,
    t.day,
    t.time_start,
    t.time_end,
    t.created_at,
    t.updated_at
FROM timetables t;

-- =====================================
-- STEP 6: CREATE UTILITY FUNCTIONS
-- =====================================

-- Function to get NEP course statistics
CREATE OR REPLACE FUNCTION get_nep_course_stats()
RETURNS TABLE (
    nep_course_type TEXT,
    total_courses bigint,
    total_credits bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.nep_course_type,
        COUNT(*) as total_courses,
        SUM(c.credits) as total_credits
    FROM courses c
    WHERE c.is_nep = true AND c.nep_course_type IS NOT NULL
    GROUP BY c.nep_course_type
    ORDER BY total_courses DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get student program statistics
CREATE OR REPLACE FUNCTION get_program_stats()
RETURNS TABLE (
    program_id TEXT,
    total_students bigint,
    avg_semester numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.program_id,
        COUNT(s.id) as total_students,
        ROUND(AVG(s.current_semester), 2) as avg_semester
    FROM students s
    GROUP BY s.program_id
    ORDER BY total_students DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- STEP 7: ADD DOCUMENTATION COMMENTS
-- =====================================

COMMENT ON COLUMN students.program_id IS 'Reference to academic program for student tracking';
COMMENT ON COLUMN students.current_semester IS 'Current semester number for academic progress tracking';
COMMENT ON COLUMN courses.is_nep IS 'Boolean flag indicating if course follows NEP guidelines';
COMMENT ON COLUMN courses.nep_course_type IS 'NEP course category: Major, Minor, MDC, AEC, SEC, VAC, OEC, IDC, FC, LC';

-- =====================================
-- MIGRATION COMPLETE
-- =====================================

-- Verify the migration
SELECT 'Migration completed successfully. New columns added:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name IN ('is_nep', 'nep_course_type')
UNION ALL
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name IN ('program_id', 'current_semester');
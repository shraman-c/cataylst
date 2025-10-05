-- Migration script to update courses table to new structure
-- This script will safely update the courses table to match the new requirements

BEGIN;

-- Check if we need to add department column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'department') THEN
        ALTER TABLE courses ADD COLUMN department TEXT;
        RAISE NOTICE 'Added department column to courses table';
    ELSE
        RAISE NOTICE 'department column already exists in courses table';
    END IF;
END $$;

-- Update the id column to be TEXT if it's currently UUID
DO $$
BEGIN
    -- Check current data type of id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        -- If there's existing data, we need to handle it carefully
        -- For now, we'll assume the table can be recreated or is empty
        -- In production, you'd want to migrate existing data
        
        RAISE NOTICE 'Converting courses.id from UUID to TEXT';
        
        -- Create new table with correct structure
        CREATE TABLE courses_new (
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
        
        -- Copy existing data if any (converting UUID to TEXT)
        INSERT INTO courses_new (id, name, department, credits, classes_per_week, is_lab, semester, is_nep, nep_course_type, created_at, updated_at)
        SELECT 
            CASE 
                WHEN custom_id IS NOT NULL AND custom_id != '' THEN custom_id
                ELSE id::TEXT
            END as id,
            name,
            COALESCE(department, 'General') as department,
            credits,
            classes_per_week,
            is_lab,
            semester,
            COALESCE(is_nep, FALSE) as is_nep,
            nep_course_type,
            created_at,
            updated_at
        FROM courses;
        
        -- Drop old table and rename new one
        DROP TABLE courses CASCADE;
        ALTER TABLE courses_new RENAME TO courses;
        
        RAISE NOTICE 'Successfully converted courses table structure';
    ELSE
        RAISE NOTICE 'courses.id column is already TEXT or table structure is correct';
    END IF;
END $$;

-- Remove columns that are no longer needed
DO $$
BEGIN
    -- Remove custom_id column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'custom_id') THEN
        ALTER TABLE courses DROP COLUMN IF EXISTS custom_id;
        RAISE NOTICE 'Removed custom_id column from courses table';
    END IF;
    
    -- Remove program_id column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'program_id') THEN
        ALTER TABLE courses DROP COLUMN IF EXISTS program_id;
        RAISE NOTICE 'Removed program_id column from courses table';
    END IF;
    
    -- Remove is_elective column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_elective') THEN
        ALTER TABLE courses DROP COLUMN IF EXISTS is_elective;
        RAISE NOTICE 'Removed is_elective column from courses table';
    END IF;
    
    -- Remove prerequisite_courses column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'prerequisite_courses') THEN
        ALTER TABLE courses DROP COLUMN IF EXISTS prerequisite_courses;
        RAISE NOTICE 'Removed prerequisite_courses column from courses table';
    END IF;
END $$;

-- Ensure department column has proper NOT NULL constraint and default values
UPDATE courses SET department = 'General' WHERE department IS NULL OR department = '';
ALTER TABLE courses ALTER COLUMN department SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
CREATE INDEX IF NOT EXISTS idx_courses_is_nep ON courses(is_nep);
CREATE INDEX IF NOT EXISTS idx_courses_is_lab ON courses(is_lab);

-- Add comments for documentation
COMMENT ON TABLE courses IS 'Courses table with simplified structure: id (PK), name, department, credits, classes_per_week, is_lab, semester, is_nep, nep_course_type';
COMMENT ON COLUMN courses.id IS 'Primary key - course identifier';
COMMENT ON COLUMN courses.name IS 'Course name';
COMMENT ON COLUMN courses.department IS 'Department offering the course';
COMMENT ON COLUMN courses.credits IS 'Number of credits for the course';
COMMENT ON COLUMN courses.classes_per_week IS 'Number of classes per week';
COMMENT ON COLUMN courses.is_lab IS 'Whether this is a lab course';
COMMENT ON COLUMN courses.semester IS 'Semester in which the course is offered';
COMMENT ON COLUMN courses.is_nep IS 'Whether this follows NEP guidelines';
COMMENT ON COLUMN courses.nep_course_type IS 'NEP course category if applicable';

COMMIT;

-- Display final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;
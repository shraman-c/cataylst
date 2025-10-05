-- Migration SQL for Supabase 'courses' table: use course code as primary key, allow duplicate names
-- Run this in the Supabase SQL editor

-- Drop old unique constraints if any
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='courses' AND constraint_type='PRIMARY KEY') THEN
    ALTER TABLE courses DROP CONSTRAINT courses_pkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='courses' AND constraint_name='courses_name_key') THEN
    ALTER TABLE courses DROP CONSTRAINT courses_name_key;
  END IF;
END$$;

-- Set course code (id) as primary key
ALTER TABLE courses ALTER COLUMN id TYPE text;
ALTER TABLE courses ALTER COLUMN id SET NOT NULL;
ALTER TABLE courses ADD PRIMARY KEY (id);

-- Allow duplicate names (no unique constraint on name)
-- (No action needed if not present)

-- Ensure all other columns exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS classes_per_week integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_lab boolean;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_id text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_elective boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite_courses jsonb DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_nep boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS nep_course_type text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department text;

-- Programs and Sections Management System
-- This creates programs table and then applies the sections functionality

-- =====================================
-- CREATE PROGRAMS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g., "CSE", "ECE", "EEE"
    name TEXT NOT NULL, -- e.g., "Computer Science Engineering"
    description TEXT,
    duration_years INTEGER DEFAULT 4 CHECK (duration_years > 0),
    total_semesters INTEGER DEFAULT 8 CHECK (total_semesters > 0),
    department_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to departments
    CONSTRAINT fk_programs_department 
        FOREIGN KEY (department_code) 
        REFERENCES departments(code) 
        ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_code);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);

-- Add comments
COMMENT ON TABLE programs IS 'Academic programs offered by the institution';

-- =====================================
-- INSERT SAMPLE PROGRAMS
-- =====================================

INSERT INTO programs (custom_id, code, name, description, department_code) VALUES
('prog_cse', 'BTCSE', 'Computer Science Engineering', 'Bachelor of Technology in Computer Science and Engineering', 'CSE'),
('prog_ece', 'BTECE', 'Electronics and Communication Engineering', 'Bachelor of Technology in Electronics and Communication Engineering', 'ECE'),
('prog_eee', 'BTEEE', 'Electrical and Electronics Engineering', 'Bachelor of Technology in Electrical and Electronics Engineering', 'EEE'),
('prog_mech', 'BTME', 'Mechanical Engineering', 'Bachelor of Technology in Mechanical Engineering', 'ME'),
('prog_civil', 'BTCE', 'Civil Engineering', 'Bachelor of Technology in Civil Engineering', 'CE'),
('prog_it', 'BTIT', 'Information Technology', 'Bachelor of Technology in Information Technology', 'IT'),
('prog_biotech', 'BTBT', 'Biotechnology', 'Bachelor of Technology in Biotechnology', 'BT')

ON CONFLICT (custom_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    department_code = EXCLUDED.department_code,
    updated_at = NOW();

-- =====================================
-- CREATE SECTIONS TABLE
-- =====================================

CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL, -- e.g., "A", "B", "C" or "Alpha", "Beta"
    program_id TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
    capacity INTEGER NOT NULL DEFAULT 60 CHECK (capacity > 0),
    current_enrollment INTEGER DEFAULT 0 CHECK (current_enrollment >= 0),
    is_active BOOLEAN DEFAULT true,
    room_preference TEXT, -- Preferred room type: 'Lab', 'Classroom', 'Auditorium'
    academic_year TEXT DEFAULT '2024-25',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_sections_program 
        FOREIGN KEY (program_id) 
        REFERENCES programs(custom_id) 
        ON DELETE CASCADE,
    
    -- Ensure capacity is not exceeded
    CONSTRAINT check_enrollment_capacity 
        CHECK (current_enrollment <= capacity),
    
    -- Unique section per program-semester combination
    CONSTRAINT unique_section_per_program_semester 
        UNIQUE (program_id, semester, name)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sections_program_semester ON sections(program_id, semester);
CREATE INDEX IF NOT EXISTS idx_sections_active ON sections(is_active);
CREATE INDEX IF NOT EXISTS idx_sections_capacity ON sections(capacity, current_enrollment);

-- Add comments for documentation
COMMENT ON TABLE sections IS 'Manages sections for each program-semester combination with customizable capacity';
COMMENT ON COLUMN sections.capacity IS 'Maximum number of students that can be enrolled in this section';
COMMENT ON COLUMN sections.current_enrollment IS 'Current number of students enrolled in this section';
COMMENT ON COLUMN sections.room_preference IS 'Preferred room type for this section classes';

-- =====================================
-- UPDATE STUDENTS TABLE FOR SECTIONS
-- =====================================

-- Add section assignment and program_id to students if not exists
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS section_id TEXT,
ADD COLUMN IF NOT EXISTS program_id TEXT DEFAULT 'prog_cse';

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_section') THEN
        ALTER TABLE students 
        ADD CONSTRAINT fk_students_section 
            FOREIGN KEY (section_id) 
            REFERENCES sections(custom_id) 
            ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_students_program') THEN
        ALTER TABLE students 
        ADD CONSTRAINT fk_students_program 
            FOREIGN KEY (program_id) 
            REFERENCES programs(custom_id) 
            ON DELETE SET NULL;
    END IF;
END
$$;

-- Add indexes for student section and program lookup
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_program ON students(program_id);

-- =====================================
-- UPDATE TIMETABLES FOR SECTIONS
-- =====================================

-- Modify timetables to include section information
ALTER TABLE timetables 
ADD COLUMN IF NOT EXISTS section_id TEXT;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_timetables_section') THEN
        ALTER TABLE timetables 
        ADD CONSTRAINT fk_timetables_section 
            FOREIGN KEY (section_id) 
            REFERENCES sections(custom_id) 
            ON DELETE CASCADE;
    END IF;
END
$$;

-- Add index for timetable section lookup
CREATE INDEX IF NOT EXISTS idx_timetables_section ON timetables(section_id);

-- =====================================
-- INSERT SAMPLE SECTIONS
-- =====================================

-- Create sections for each program-semester combination
INSERT INTO sections (custom_id, name, program_id, semester, capacity, room_preference) VALUES
-- CSE Program Sections
('sec_cse_1_a', 'A', 'prog_cse', 1, 60, 'Classroom'),
('sec_cse_1_b', 'B', 'prog_cse', 1, 55, 'Classroom'),
('sec_cse_2_a', 'A', 'prog_cse', 2, 58, 'Classroom'),
('sec_cse_2_b', 'B', 'prog_cse', 2, 52, 'Lab'),
('sec_cse_3_a', 'A', 'prog_cse', 3, 50, 'Lab'),
('sec_cse_4_a', 'A', 'prog_cse', 4, 48, 'Lab'),

-- ECE Program Sections  
('sec_ece_1_a', 'A', 'prog_ece', 1, 50, 'Classroom'),
('sec_ece_1_b', 'B', 'prog_ece', 1, 45, 'Classroom'),
('sec_ece_2_a', 'A', 'prog_ece', 2, 48, 'Lab'),
('sec_ece_3_a', 'A', 'prog_ece', 3, 42, 'Lab'),

-- EEE Program Sections
('sec_eee_1_a', 'A', 'prog_eee', 1, 40, 'Classroom'),
('sec_eee_2_a', 'A', 'prog_eee', 2, 38, 'Lab'),

-- MECH Program Sections
('sec_mech_1_a', 'A', 'prog_mech', 1, 45, 'Classroom'),
('sec_mech_2_a', 'A', 'prog_mech', 2, 42, 'Classroom'),

-- CIVIL Program Sections
('sec_civil_1_a', 'A', 'prog_civil', 1, 35, 'Classroom'),
('sec_civil_2_a', 'A', 'prog_civil', 2, 32, 'Classroom'),

-- IT Program Sections
('sec_it_1_a', 'A', 'prog_it', 1, 50, 'Classroom'),
('sec_it_2_a', 'A', 'prog_it', 2, 45, 'Lab'),

-- Biotech Program Sections
('sec_biotech_1_a', 'A', 'prog_biotech', 1, 30, 'Lab'),
('sec_biotech_2_a', 'A', 'prog_biotech', 2, 28, 'Lab')

ON CONFLICT (custom_id) DO UPDATE SET
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    room_preference = EXCLUDED.room_preference,
    updated_at = NOW();

-- =====================================
-- UPDATE SAMPLE DATA WITH PROGRAMS
-- =====================================

-- Update students with program information based on existing data
UPDATE students SET program_id = CASE 
    WHEN student_id LIKE '%CSE%' OR student_id LIKE '%cse%' THEN 'prog_cse'
    WHEN student_id LIKE '%ECE%' OR student_id LIKE '%ece%' THEN 'prog_ece'
    WHEN student_id LIKE '%EEE%' OR student_id LIKE '%eee%' THEN 'prog_eee'
    WHEN student_id LIKE '%ME%' OR student_id LIKE '%mech%' THEN 'prog_mech'
    WHEN student_id LIKE '%CE%' OR student_id LIKE '%civil%' THEN 'prog_civil'
    WHEN student_id LIKE '%IT%' OR student_id LIKE '%it%' THEN 'prog_it'
    WHEN student_id LIKE '%BT%' OR student_id LIKE '%biotech%' THEN 'prog_biotech'
    ELSE 'prog_cse'
END;

-- Update courses with programs reference
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS program_id TEXT;

UPDATE courses SET program_id = CASE 
    WHEN program_id = 'BTCSE' OR program_id LIKE '%CSE%' THEN 'prog_cse'
    WHEN program_id = 'BTECE' OR program_id LIKE '%ECE%' THEN 'prog_ece'
    WHEN program_id = 'BTEEE' OR program_id LIKE '%EEE%' THEN 'prog_eee'
    WHEN program_id = 'BTME' OR program_id LIKE '%ME%' THEN 'prog_mech'
    WHEN program_id = 'BTCE' OR program_id LIKE '%CE%' THEN 'prog_civil'
    WHEN program_id = 'BTIT' OR program_id LIKE '%IT%' THEN 'prog_it'
    WHEN program_id = 'BTBT' OR program_id LIKE '%BT%' THEN 'prog_biotech'
    ELSE 'prog_cse'
END;

-- =====================================
-- ASSIGN STUDENTS TO SECTIONS
-- =====================================

-- Function to auto-assign students to sections based on capacity
CREATE OR REPLACE FUNCTION assign_students_to_sections()
RETURNS void AS $$
DECLARE
    student_record RECORD;
    section_record RECORD;
BEGIN
    -- Loop through all students without section assignment
    FOR student_record IN 
        SELECT s.custom_id, s.program_id, s.current_semester
        FROM students s 
        WHERE s.section_id IS NULL 
        ORDER BY s.custom_id
    LOOP
        -- Find available section for this student's program and semester
        SELECT sec.custom_id INTO section_record
        FROM sections sec
        WHERE sec.program_id = student_record.program_id
          AND sec.semester = student_record.current_semester
          AND sec.current_enrollment < sec.capacity
          AND sec.is_active = true
        ORDER BY sec.current_enrollment ASC, sec.name ASC
        LIMIT 1;
        
        -- If section found, assign student and update enrollment
        IF section_record.custom_id IS NOT NULL THEN
            UPDATE students 
            SET section_id = section_record.custom_id 
            WHERE custom_id = student_record.custom_id;
            
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1 
            WHERE custom_id = section_record.custom_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the assignment function
SELECT assign_students_to_sections();

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Show programs with department mapping
SELECT 'PROGRAMS BY DEPARTMENT:' as info;
SELECT 
    d.name as department,
    p.code as program_code,
    p.name as program_name,
    p.duration_years,
    p.total_semesters
FROM programs p
LEFT JOIN departments d ON p.department_code = d.code
WHERE p.is_active = true
ORDER BY d.name, p.name;

-- Show sections with enrollment status
SELECT 'SECTIONS BY PROGRAM:' as info;
SELECT 
    p.code as program,
    s.semester,
    s.name as section,
    s.capacity,
    s.current_enrollment,
    ROUND((s.current_enrollment::DECIMAL / s.capacity) * 100, 1) as utilization_percent,
    s.room_preference
FROM sections s
JOIN programs p ON s.program_id = p.custom_id
WHERE s.is_active = true
ORDER BY p.code, s.semester, s.name;

-- Show student distribution across sections
SELECT 'STUDENT SECTION DISTRIBUTION:' as info;
SELECT 
    p.code as program,
    s.semester,
    s.name as section,
    COUNT(st.id) as actual_students,
    s.capacity,
    s.capacity - COUNT(st.id) as available_spots
FROM sections s
JOIN programs p ON s.program_id = p.custom_id
LEFT JOIN students st ON s.custom_id = st.section_id
WHERE s.is_active = true
GROUP BY p.code, s.semester, s.name, s.capacity
ORDER BY p.code, s.semester, s.name;

-- Show capacity utilization summary
SELECT 'CAPACITY UTILIZATION SUMMARY:' as info;
SELECT 
    COUNT(*) as total_sections,
    SUM(capacity) as total_capacity,
    SUM(current_enrollment) as total_enrolled,
    ROUND(AVG(current_enrollment::DECIMAL / capacity) * 100, 1) as avg_utilization,
    COUNT(CASE WHEN current_enrollment = capacity THEN 1 END) as full_sections,
    COUNT(CASE WHEN current_enrollment = 0 THEN 1 END) as empty_sections
FROM sections 
WHERE is_active = true;

SELECT '✅ Programs and Sections system setup completed! You can now manage academic programs and their sections.' as status;
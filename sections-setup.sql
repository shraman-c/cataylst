-- Sections Management System for Timetable Generation
-- This enables multiple sections per program/semester with customizable capacity

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

-- Add section assignment and department to students
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS section_id TEXT,
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General',
ADD CONSTRAINT fk_students_section 
    FOREIGN KEY (section_id) 
    REFERENCES sections(custom_id) 
    ON DELETE SET NULL;

-- Add index for student section lookup
CREATE INDEX IF NOT EXISTS idx_students_section ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);

-- =====================================
-- UPDATE TIMETABLES FOR SECTIONS
-- =====================================

-- Modify timetables to include section information
ALTER TABLE timetables 
ADD COLUMN IF NOT EXISTS section_id TEXT,
ADD CONSTRAINT fk_timetables_section 
    FOREIGN KEY (section_id) 
    REFERENCES sections(custom_id) 
    ON DELETE CASCADE;

-- Add index for timetable section lookup
CREATE INDEX IF NOT EXISTS idx_timetables_section ON timetables(section_id);

-- =====================================
-- UPDATE TEACHERS TABLE FOR DEPARTMENT
-- =====================================

-- Add department to teachers
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';

-- Add index for teacher department lookup
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department);

-- =====================================
-- UPDATE COURSES TABLE FOR DEPARTMENT
-- =====================================

-- Add department category to courses/subjects
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';

-- Add index for course department lookup
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);

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
('sec_civil_2_a', 'A', 'prog_civil', 2, 32, 'Classroom')

ON CONFLICT (custom_id) DO UPDATE SET
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    room_preference = EXCLUDED.room_preference,
    updated_at = NOW();

-- =====================================
-- UPDATE SAMPLE DATA WITH DEPARTMENTS
-- =====================================

-- Update students with department information
UPDATE students SET department = CASE 
    WHEN program_id = 'prog_cse' THEN 'CSE'
    WHEN program_id = 'prog_ece' THEN 'ECE'
    WHEN program_id = 'prog_eee' THEN 'EEE'
    WHEN program_id = 'prog_mech' THEN 'MECH'
    WHEN program_id = 'prog_civil' THEN 'CIVIL'
    ELSE 'General'
END;

-- Update teachers with department information based on their subjects
UPDATE teachers SET department = CASE 
    WHEN teacherId LIKE '%cse%' OR LOWER(name) LIKE '%computer%' THEN 'CSE'
    WHEN teacherId LIKE '%ece%' OR LOWER(name) LIKE '%electronics%' THEN 'ECE'
    WHEN teacherId LIKE '%eee%' OR LOWER(name) LIKE '%electrical%' THEN 'EEE'
    WHEN teacherId LIKE '%mech%' OR LOWER(name) LIKE '%mechanical%' THEN 'MECH'
    WHEN teacherId LIKE '%civil%' OR LOWER(name) LIKE '%civil%' THEN 'CIVIL'
    WHEN LOWER(name) LIKE '%math%' OR LOWER(name) LIKE '%physics%' OR LOWER(name) LIKE '%chemistry%' THEN 'Science'
    WHEN LOWER(name) LIKE '%english%' OR LOWER(name) LIKE '%language%' THEN 'Humanities'
    ELSE 'General'
END;

-- Update courses with department categories
UPDATE courses SET department = CASE 
    WHEN LOWER(name) LIKE '%programming%' OR LOWER(name) LIKE '%computer%' OR LOWER(name) LIKE '%software%' OR LOWER(name) LIKE '%algorithm%' OR LOWER(name) LIKE '%database%' THEN 'CSE'
    WHEN LOWER(name) LIKE '%circuit%' OR LOWER(name) LIKE '%electronics%' OR LOWER(name) LIKE '%communication%' OR LOWER(name) LIKE '%signal%' THEN 'ECE'
    WHEN LOWER(name) LIKE '%electrical%' OR LOWER(name) LIKE '%power%' OR LOWER(name) LIKE '%motor%' OR LOWER(name) LIKE '%energy%' THEN 'EEE'
    WHEN LOWER(name) LIKE '%mechanical%' OR LOWER(name) LIKE '%thermodynamics%' OR LOWER(name) LIKE '%machine%' OR LOWER(name) LIKE '%manufacturing%' THEN 'MECH'
    WHEN LOWER(name) LIKE '%civil%' OR LOWER(name) LIKE '%structure%' OR LOWER(name) LIKE '%construction%' OR LOWER(name) LIKE '%concrete%' THEN 'CIVIL'
    WHEN LOWER(name) LIKE '%math%' OR LOWER(name) LIKE '%calculus%' OR LOWER(name) LIKE '%algebra%' OR LOWER(name) LIKE '%statistics%' THEN 'Mathematics'
    WHEN LOWER(name) LIKE '%physics%' OR LOWER(name) LIKE '%mechanics%' OR LOWER(name) LIKE '%optics%' THEN 'Physics'
    WHEN LOWER(name) LIKE '%chemistry%' OR LOWER(name) LIKE '%organic%' OR LOWER(name) LIKE '%inorganic%' THEN 'Chemistry'
    WHEN LOWER(name) LIKE '%english%' OR LOWER(name) LIKE '%communication%' OR LOWER(name) LIKE '%writing%' THEN 'English'
    WHEN LOWER(name) LIKE '%management%' OR LOWER(name) LIKE '%economics%' OR LOWER(name) LIKE '%business%' THEN 'Management'
    ELSE 'General'
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

-- Show student distribution across sections with department info
SELECT 'STUDENT SECTION DISTRIBUTION:' as info;
SELECT 
    p.code as program,
    s.semester,
    s.name as section,
    COUNT(st.id) as actual_students,
    s.capacity,
    s.capacity - COUNT(st.id) as available_spots,
    STRING_AGG(DISTINCT st.department, ', ') as departments
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

-- Show department-wise distribution
SELECT 'DEPARTMENT-WISE DISTRIBUTION:' as info;
SELECT 
    'Students' as entity,
    department,
    COUNT(*) as count
FROM students 
GROUP BY department
UNION ALL
SELECT 
    'Teachers' as entity,
    department,
    COUNT(*) as count
FROM teachers 
GROUP BY department
UNION ALL
SELECT 
    'Courses' as entity,
    department,
    COUNT(*) as count
FROM courses 
GROUP BY department
ORDER BY entity, department;

SELECT '✅ Sections system with departments setup completed! You can now manage sections with department categorization.' as status;
-- Setup Script: Populate Tables with Nice Sample Data
-- Run this in Supabase SQL Editor to set up your tables with realistic data

-- =====================================
-- STEP 1: SET UP ACADEMIC PROGRAMS
-- =====================================

-- Clear existing programs and add proper ones
DELETE FROM programs;

INSERT INTO programs (custom_id, name, code, total_semesters, description) VALUES
('prog_cse', 'Computer Science and Engineering', 'CSE', 8, 'Bachelor of Technology in Computer Science and Engineering'),
('prog_ece', 'Electronics and Communication Engineering', 'ECE', 8, 'Bachelor of Technology in Electronics and Communication Engineering'),
('prog_eee', 'Electrical and Electronics Engineering', 'EEE', 8, 'Bachelor of Technology in Electrical and Electronics Engineering'),
('prog_mech', 'Mechanical Engineering', 'MECH', 8, 'Bachelor of Technology in Mechanical Engineering'),
('prog_civil', 'Civil Engineering', 'CIVIL', 8, 'Bachelor of Technology in Civil Engineering'),
('prog_mca', 'Master of Computer Applications', 'MCA', 6, 'Master of Computer Applications'),
('prog_mtech_cse', 'M.Tech Computer Science', 'MTECH-CSE', 4, 'Master of Technology in Computer Science');

-- =====================================
-- STEP 2: UPDATE STUDENT DATA WITH PROPER PROGRAMS
-- =====================================

-- Update existing students with realistic program assignments
UPDATE students SET 
    program_id = CASE 
        WHEN id IN (SELECT id FROM students ORDER BY id LIMIT 15) THEN 'prog_cse'
        WHEN id IN (SELECT id FROM students ORDER BY id LIMIT 30 OFFSET 15) THEN 'prog_ece'
        WHEN id IN (SELECT id FROM students ORDER BY id LIMIT 20 OFFSET 30) THEN 'prog_eee'
        WHEN id IN (SELECT id FROM students ORDER BY id LIMIT 10 OFFSET 50) THEN 'prog_mech'
        ELSE 'prog_civil'
    END,
    current_semester = CASE 
        WHEN RANDOM() < 0.2 THEN 1
        WHEN RANDOM() < 0.4 THEN 2
        WHEN RANDOM() < 0.6 THEN 3
        WHEN RANDOM() < 0.75 THEN 4
        WHEN RANDOM() < 0.85 THEN 5
        WHEN RANDOM() < 0.92 THEN 6
        WHEN RANDOM() < 0.97 THEN 7
        ELSE 8
    END;

-- =====================================
-- STEP 3: SET UP COURSES WITH NEP CATEGORIZATION
-- =====================================

-- Update existing courses with NEP information
UPDATE courses SET 
    is_nep = CASE 
        WHEN RANDOM() < 0.7 THEN true  -- 70% courses are NEP
        ELSE false
    END;

-- Set NEP course types for NEP courses
UPDATE courses SET 
    nep_course_type = CASE 
        WHEN name ILIKE '%mathematics%' OR name ILIKE '%physics%' OR name ILIKE '%chemistry%' THEN 'FC'
        WHEN name ILIKE '%english%' OR name ILIKE '%communication%' OR name ILIKE '%language%' THEN 'LC'
        WHEN name ILIKE '%programming%' OR name ILIKE '%data structures%' OR name ILIKE '%algorithms%' THEN 'Major'
        WHEN name ILIKE '%lab%' OR name ILIKE '%practical%' THEN 'SEC'
        WHEN name ILIKE '%management%' OR name ILIKE '%economics%' OR name ILIKE '%accounting%' THEN 'MDC'
        WHEN name ILIKE '%ethics%' OR name ILIKE '%values%' OR name ILIKE '%environment%' THEN 'VAC'
        WHEN name ILIKE '%elective%' THEN 'OEC'
        WHEN name ILIKE '%project%' OR name ILIKE '%seminar%' THEN 'AEC'
        WHEN name ILIKE '%interdisciplinary%' OR name ILIKE '%multi%' THEN 'IDC'
        WHEN RANDOM() < 0.3 THEN 'Major'
        WHEN RANDOM() < 0.5 THEN 'Minor'
        WHEN RANDOM() < 0.65 THEN 'SEC'
        WHEN RANDOM() < 0.75 THEN 'AEC'
        WHEN RANDOM() < 0.85 THEN 'MDC'
        WHEN RANDOM() < 0.9 THEN 'VAC'
        WHEN RANDOM() < 0.95 THEN 'OEC'
        ELSE 'IDC'
    END
WHERE is_nep = true;

-- =====================================
-- STEP 4: ADD SAMPLE COURSES IF NEEDED
-- =====================================

-- Add some specific NEP-compliant courses if the table is sparse
INSERT INTO courses (custom_id, name, credits, classes_per_week, is_nep, nep_course_type, program_id) VALUES
('course_math1', 'Engineering Mathematics I', 4, 4, true, 'FC', 'prog_cse'),
('course_phy1', 'Engineering Physics', 3, 3, true, 'FC', 'prog_cse'),
('course_eng1', 'Technical English', 2, 2, true, 'LC', 'prog_cse'),
('course_prog1', 'Programming Fundamentals', 4, 6, true, 'Major', 'prog_cse'),
('course_ds1', 'Data Structures and Algorithms', 4, 6, true, 'Major', 'prog_cse'),
('course_dbms1', 'Database Management Systems', 3, 4, true, 'Major', 'prog_cse'),
('course_os1', 'Operating Systems', 3, 4, true, 'Major', 'prog_cse'),
('course_net1', 'Computer Networks', 3, 4, true, 'Major', 'prog_cse'),
('course_se1', 'Software Engineering', 3, 3, true, 'Major', 'prog_cse'),
('course_ai1', 'Artificial Intelligence', 3, 4, true, 'Major', 'prog_cse'),
('course_ml1', 'Machine Learning', 3, 4, true, 'OEC', 'prog_cse'),
('course_web1', 'Web Development Lab', 2, 4, true, 'SEC', 'prog_cse'),
('course_ethics1', 'Professional Ethics', 2, 2, true, 'VAC', 'prog_cse'),
('course_mgmt1', 'Engineering Management', 2, 2, true, 'MDC', 'prog_cse'),
('course_env1', 'Environmental Studies', 2, 2, true, 'VAC', 'prog_cse'),
('course_project1', 'Capstone Project', 6, 8, true, 'AEC', 'prog_cse'),
('course_intern1', 'Industrial Training', 4, 0, true, 'AEC', 'prog_cse'),
('course_research1', 'Research Methodology', 2, 2, true, 'AEC', 'prog_cse'),
('course_bio1', 'Bioinformatics', 3, 3, true, 'IDC', 'prog_cse'),
('course_quantum1', 'Quantum Computing', 3, 3, true, 'Minor', 'prog_cse')
ON CONFLICT (custom_id) DO NOTHING;

-- =====================================
-- STEP 5: SET UP ROOMS WITH BETTER ORGANIZATION
-- =====================================

-- Update existing rooms with better names and lab designations
UPDATE rooms SET 
    name = CASE 
        WHEN is_lab = true THEN 
            CASE 
                WHEN RANDOM() < 0.3 THEN 'Computer Lab ' || (ROW_NUMBER() OVER (ORDER BY id))
                WHEN RANDOM() < 0.6 THEN 'Electronics Lab ' || (ROW_NUMBER() OVER (ORDER BY id))
                ELSE 'Engineering Lab ' || (ROW_NUMBER() OVER (ORDER BY id))
            END
        ELSE 'Classroom ' || (ROW_NUMBER() OVER (ORDER BY id))
    END,
    capacity = CASE 
        WHEN is_lab = true THEN (RANDOM() * 20 + 30)::INTEGER  -- Labs: 30-50 capacity
        ELSE (RANDOM() * 40 + 60)::INTEGER  -- Classrooms: 60-100 capacity
    END;

-- =====================================
-- STEP 6: UPDATE TEACHER DESIGNATIONS
-- =====================================

-- Update teachers with proper designations and subjects
UPDATE teachers SET 
    designation = CASE 
        WHEN RANDOM() < 0.1 THEN 'Professor'
        WHEN RANDOM() < 0.3 THEN 'Associate Professor'
        WHEN RANDOM() < 0.7 THEN 'Assistant Professor'
        WHEN RANDOM() < 0.9 THEN 'HOD'
        ELSE 'Dean'
    END,
    subjects = CASE 
        WHEN RANDOM() < 0.3 THEN '["Mathematics", "Physics"]'::jsonb
        WHEN RANDOM() < 0.5 THEN '["Computer Science", "Programming"]'::jsonb
        WHEN RANDOM() < 0.7 THEN '["Electronics", "Communication"]'::jsonb
        ELSE '["Mechanical Engineering", "Thermodynamics"]'::jsonb
    END;

-- =====================================
-- STEP 7: VERIFICATION AND SUMMARY
-- =====================================

-- Show the updated data summary
SELECT 'PROGRAMS SUMMARY' as section;
SELECT code, name, total_semesters FROM programs ORDER BY code;

SELECT 'STUDENTS BY PROGRAM' as section;
SELECT 
    p.code as program,
    COUNT(s.id) as student_count,
    ROUND(AVG(s.current_semester), 1) as avg_semester
FROM students s
JOIN programs p ON s.program_id = p.custom_id
GROUP BY p.code, p.name
ORDER BY student_count DESC;

SELECT 'NEP COURSES SUMMARY' as section;
SELECT 
    nep_course_type,
    COUNT(*) as course_count,
    ROUND(AVG(credits), 1) as avg_credits
FROM courses 
WHERE is_nep = true 
GROUP BY nep_course_type 
ORDER BY course_count DESC;

SELECT 'COURSE DISTRIBUTION' as section;
SELECT 
    'NEP Courses' as type,
    COUNT(*) as count
FROM courses WHERE is_nep = true
UNION ALL
SELECT 
    'Non-NEP Courses' as type,
    COUNT(*) as count
FROM courses WHERE is_nep = false
ORDER BY count DESC;

SELECT 'TEACHERS BY DESIGNATION' as section;
SELECT 
    designation,
    COUNT(*) as teacher_count
FROM teachers 
GROUP BY designation 
ORDER BY teacher_count DESC;

SELECT 'ROOMS SUMMARY' as section;
SELECT 
    CASE WHEN is_lab THEN 'Labs' ELSE 'Classrooms' END as room_type,
    COUNT(*) as room_count,
    ROUND(AVG(capacity), 0) as avg_capacity
FROM rooms 
GROUP BY is_lab 
ORDER BY room_count DESC;

SELECT '✅ Tables setup completed successfully!' as status;
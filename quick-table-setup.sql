-- Quick Table Setup Script for Catalyst Dashboard
-- Run this in Supabase SQL Editor to organize your tables nicely

-- =====================================
-- SETUP PROGRAMS TABLE
-- =====================================

INSERT INTO programs (custom_id, name, code, total_semesters, description, is_nep) VALUES
('prog_cse', 'Computer Science Engineering', 'CSE', 8, 'B.Tech in Computer Science', true),
('prog_ece', 'Electronics & Communication', 'ECE', 8, 'B.Tech in Electronics', true),
('prog_eee', 'Electrical Engineering', 'EEE', 8, 'B.Tech in Electrical', true),
('prog_mech', 'Mechanical Engineering', 'MECH', 8, 'B.Tech in Mechanical', false),
('prog_civil', 'Civil Engineering', 'CIVIL', 8, 'B.Tech in Civil', false)
ON CONFLICT (custom_id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    total_semesters = EXCLUDED.total_semesters,
    description = EXCLUDED.description,
    is_nep = EXCLUDED.is_nep;

-- =====================================
-- UPDATE STUDENTS WITH REALISTIC DATA
-- =====================================

-- First 15 students → CSE
UPDATE students SET 
    program_id = 'prog_cse',
    current_semester = (RANDOM() * 7 + 1)::INTEGER
WHERE custom_id IN (
    SELECT custom_id FROM students ORDER BY custom_id LIMIT 15
);

-- Next 15 students → ECE  
UPDATE students SET 
    program_id = 'prog_ece',
    current_semester = (RANDOM() * 7 + 1)::INTEGER
WHERE custom_id IN (
    SELECT custom_id FROM students ORDER BY custom_id LIMIT 15 OFFSET 15
);

-- Next 15 students → EEE
UPDATE students SET 
    program_id = 'prog_eee', 
    current_semester = (RANDOM() * 7 + 1)::INTEGER
WHERE custom_id IN (
    SELECT custom_id FROM students ORDER BY custom_id LIMIT 15 OFFSET 30
);

-- Remaining students → MECH and CIVIL
UPDATE students SET 
    program_id = CASE 
        WHEN RANDOM() < 0.5 THEN 'prog_mech'
        ELSE 'prog_civil'
    END,
    current_semester = (RANDOM() * 7 + 1)::INTEGER
WHERE program_id = 'default-program';

-- =====================================
-- SETUP COURSES WITH NEP DATA
-- =====================================

-- Mark 70% of courses as NEP
UPDATE courses SET is_nep = true WHERE RANDOM() < 0.7;

-- Assign NEP course types intelligently
UPDATE courses SET nep_course_type = 
    CASE 
        WHEN name ILIKE '%math%' OR name ILIKE '%physics%' OR name ILIKE '%chemistry%' THEN 'FC'
        WHEN name ILIKE '%english%' OR name ILIKE '%communication%' THEN 'LC'
        WHEN name ILIKE '%programming%' OR name ILIKE '%algorithm%' OR name ILIKE '%data%' THEN 'Major'
        WHEN name ILIKE '%lab%' OR name ILIKE '%practical%' THEN 'SEC'
        WHEN name ILIKE '%management%' OR name ILIKE '%economics%' THEN 'MDC'
        WHEN name ILIKE '%ethics%' OR name ILIKE '%environment%' THEN 'VAC'
        WHEN name ILIKE '%elective%' THEN 'OEC'
        WHEN name ILIKE '%project%' OR name ILIKE '%seminar%' THEN 'AEC'
        WHEN RANDOM() < 0.25 THEN 'Major'
        WHEN RANDOM() < 0.4 THEN 'Minor'
        WHEN RANDOM() < 0.55 THEN 'SEC'
        WHEN RANDOM() < 0.7 THEN 'AEC'
        WHEN RANDOM() < 0.8 THEN 'MDC'
        WHEN RANDOM() < 0.9 THEN 'VAC'
        ELSE 'OEC'
    END
WHERE is_nep = true;

-- =====================================
-- ADD SAMPLE NEP COURSES
-- =====================================

INSERT INTO courses (custom_id, name, credits, classes_per_week, is_nep, nep_course_type) VALUES
('nep_math1', 'Engineering Mathematics I', 4, 4, true, 'FC'),
('nep_physics', 'Engineering Physics', 3, 3, true, 'FC'),
('nep_english', 'Technical Communication', 2, 2, true, 'LC'),
('nep_prog', 'Programming Fundamentals', 4, 6, true, 'Major'),
('nep_ds', 'Data Structures', 4, 6, true, 'Major'),
('nep_weblab', 'Web Development Lab', 2, 4, true, 'SEC'),
('nep_ethics', 'Professional Ethics', 2, 2, true, 'VAC'),
('nep_mgmt', 'Engineering Management', 2, 2, true, 'MDC'),
('nep_ml', 'Machine Learning', 3, 4, true, 'OEC'),
('nep_project', 'Capstone Project', 6, 8, true, 'AEC'),
('nep_minor', 'Data Science Minor', 3, 3, true, 'Minor'),
('nep_inter', 'Interdisciplinary AI', 3, 3, true, 'IDC')
ON CONFLICT (custom_id) DO NOTHING;

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Show program distribution
SELECT 'STUDENTS BY PROGRAM:' as info;
SELECT 
    p.code,
    p.name,
    CASE WHEN p.is_nep THEN 'NEP' ELSE 'Non-NEP' END as program_type,
    COUNT(s.id) as students,
    ROUND(AVG(s.current_semester), 1) as avg_semester
FROM programs p
LEFT JOIN students s ON p.custom_id = s.program_id
GROUP BY p.code, p.name, p.is_nep
ORDER BY students DESC;

-- Show NEP course distribution  
SELECT 'NEP COURSES BY TYPE:' as info;
SELECT 
    nep_course_type,
    COUNT(*) as courses,
    CASE nep_course_type
        WHEN 'FC' THEN 'Foundation Course'
        WHEN 'LC' THEN 'Language Course'
        WHEN 'Major' THEN 'Major Core'
        WHEN 'Minor' THEN 'Minor'
        WHEN 'SEC' THEN 'Skill Enhancement'
        WHEN 'AEC' THEN 'Ability Enhancement'
        WHEN 'MDC' THEN 'Multi-Disciplinary'
        WHEN 'VAC' THEN 'Value Added'
        WHEN 'OEC' THEN 'Open Elective'
        WHEN 'IDC' THEN 'Inter-Disciplinary'
        ELSE 'Other'
    END as description
FROM courses 
WHERE is_nep = true 
GROUP BY nep_course_type
ORDER BY courses DESC;

-- Show overall statistics
SELECT 'OVERALL STATISTICS:' as info;
SELECT 
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM courses WHERE is_nep = true) as nep_courses,
    (SELECT COUNT(*) FROM courses WHERE is_nep = false) as non_nep_courses,
    (SELECT COUNT(*) FROM programs WHERE is_nep = true) as nep_programs,
    (SELECT COUNT(*) FROM programs WHERE is_nep = false) as non_nep_programs,
    (SELECT COUNT(DISTINCT program_id) FROM students) as active_programs;

SELECT '✅ Table setup completed! Refresh your dashboard to see the organized data.' as status;
-- Add semester field to courses table
-- Run this in Supabase SQL Editor

-- Add semester column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS semester INTEGER;

-- Add comment to describe the semester field
COMMENT ON COLUMN courses.semester IS 'Semester when this course is typically offered (1-8)';

-- Update existing courses with reasonable semester assignments
UPDATE courses SET semester = 
    CASE 
        WHEN name ILIKE '%basic%' OR name ILIKE '%fundamental%' OR name ILIKE '%introduction%' THEN 1
        WHEN name ILIKE '%advanced%' OR name ILIKE '%capstone%' OR name ILIKE '%project%' THEN 7
        WHEN name ILIKE '%intermediate%' OR name ILIKE '%ii' OR name ILIKE '% 2' THEN 3
        WHEN name ILIKE '%iii' OR name ILIKE '% 3' THEN 5
        WHEN name ILIKE '%lab%' THEN 2
        WHEN name ILIKE '%management%' OR name ILIKE '%ethics%' THEN 6
        ELSE (RANDOM() * 6 + 1)::INTEGER
    END
WHERE semester IS NULL;

-- Verify the changes
SELECT 'COURSES BY SEMESTER:' as info;
SELECT 
    semester,
    COUNT(*) as courses,
    STRING_AGG(name, ', ') as sample_courses
FROM courses 
WHERE semester IS NOT NULL
GROUP BY semester
ORDER BY semester;

SELECT '✅ Semester column added to courses table!' as status;
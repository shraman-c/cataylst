-- Add NEP designation to programs table
-- This allows programs to be classified as NEP or Non-NEP

-- Add is_nep column to programs table
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS is_nep BOOLEAN DEFAULT false;

-- Add a comment to document the field
COMMENT ON COLUMN programs.is_nep IS 'Indicates if the program follows NEP (National Education Policy) framework';

-- Update existing programs with NEP designation
-- Computer Science, Electronics, and newer engineering programs are typically NEP
UPDATE programs SET is_nep = true 
WHERE code IN ('CSE', 'ECE', 'EEE') 
   OR name ILIKE '%computer%' 
   OR name ILIKE '%electronics%'
   OR name ILIKE '%electrical%';

-- Traditional programs like Mechanical and Civil can be either, setting some as NEP
UPDATE programs SET is_nep = (RANDOM() < 0.6) 
WHERE is_nep IS NULL OR is_nep = false;

-- Verification query
SELECT 'PROGRAMS BY NEP STATUS:' as info;
SELECT 
    code,
    name,
    is_nep,
    CASE WHEN is_nep THEN 'NEP Program' ELSE 'Non-NEP Program' END as program_type,
    total_semesters
FROM programs 
ORDER BY is_nep DESC, code;
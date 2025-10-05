-- Remove Shift-Based Timing from Sections System
-- Standardize all sections to use standard timing

-- =====================================
-- REMOVE SHIFT COLUMN FROM SECTIONS
-- =====================================

-- Drop the shift constraint first
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_shift_check;

-- Remove the shift column
ALTER TABLE sections DROP COLUMN IF EXISTS shift;

-- Update existing sections to remove shift references
UPDATE sections SET updated_at = NOW() WHERE id IS NOT NULL;

-- =====================================
-- UPDATE SAMPLE DATA WITHOUT SHIFTS
-- =====================================

-- Update existing sections to remove shift dependencies
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

SELECT '✅ Shift-based timing removed! All sections now use standard timing.' as status;
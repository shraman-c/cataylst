-- =====================================
-- Catalyst Academic Management System
-- Database Enhancement Migration Script
-- =====================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- 1. CREATE DEPARTMENTS TABLE
-- =====================================

-- Create departments table with code as primary key
CREATE TABLE IF NOT EXISTS departments (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_of_department TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    building TEXT,
    floor INTEGER,
    room_numbers TEXT[],
    established_year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_hod ON departments(head_of_department);

-- Insert default departments
INSERT INTO departments (code, name, description, established_year) VALUES
    ('CSE', 'Computer Science and Engineering', 'Department of Computer Science and Engineering', 2010),
    ('ECE', 'Electronics and Communication Engineering', 'Department of Electronics and Communication Engineering', 2010),
    ('EEE', 'Electrical and Electronics Engineering', 'Department of Electrical and Electronics Engineering', 2010),
    ('MECH', 'Mechanical Engineering', 'Department of Mechanical Engineering', 2010),
    ('CIVIL', 'Civil Engineering', 'Department of Civil Engineering', 2010),
    ('Mathematics', 'Mathematics', 'Department of Mathematics', 2010),
    ('Physics', 'Physics', 'Department of Physics', 2010),
    ('Chemistry', 'Chemistry', 'Department of Chemistry', 2010),
    ('English', 'English', 'Department of English', 2010),
    ('Management', 'Management Studies', 'Department of Management Studies', 2015),
    ('General', 'General', 'General Department for Non-specific Assignments', 2010)
ON CONFLICT (code) DO NOTHING;

-- =====================================
-- 2. CREATE LABS TABLE
-- =====================================

-- Create labs table with department assignment
CREATE TABLE IF NOT EXISTS labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department_code TEXT NOT NULL REFERENCES departments(code) ON DELETE CASCADE,
    room_number TEXT,
    capacity INTEGER NOT NULL DEFAULT 30,
    equipment JSONB DEFAULT '[]',
    lab_type TEXT CHECK (lab_type IN ('Computer Lab', 'Hardware Lab', 'Research Lab', 'General Lab', 'Project Lab')),
    lab_incharge TEXT,
    maintenance_schedule TEXT,
    safety_protocols TEXT,
    operating_hours JSONB DEFAULT '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for labs
CREATE INDEX IF NOT EXISTS idx_labs_department_code ON labs(department_code);
CREATE INDEX IF NOT EXISTS idx_labs_lab_type ON labs(lab_type);
CREATE INDEX IF NOT EXISTS idx_labs_lab_incharge ON labs(lab_incharge);
CREATE INDEX IF NOT EXISTS idx_labs_is_active ON labs(is_active);

-- =====================================
-- 3. UPDATE TEACHERS TABLE
-- =====================================

-- Add department column first (if it doesn't exist)
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';

-- Add departmental role and permissions columns to teachers
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS departmental_role TEXT CHECK (departmental_role IN ('HOD', 'Teacher', 'Teaching Assistant', 'Lab Incharge')) DEFAULT 'Teacher',
ADD COLUMN IF NOT EXISTS departmental_permissions JSONB DEFAULT '{"canManageStudents": false, "canManageCourses": true, "canManageLabs": false, "canViewReports": false, "canManageSchedule": false}';

-- Add index for departmental role
CREATE INDEX IF NOT EXISTS idx_teachers_departmental_role ON teachers(departmental_role);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department);

-- Update existing teachers with default permissions based on designation
UPDATE teachers SET 
    departmental_role = CASE 
        WHEN designation = 'HOD' THEN 'HOD'
        WHEN designation IN ('Professor', 'Associate Professor', 'Assistant Professor') THEN 'Teacher'
        ELSE 'Teacher'
    END,
    departmental_permissions = CASE 
        WHEN designation = 'HOD' THEN '{"canManageStudents": true, "canManageCourses": true, "canManageLabs": true, "canViewReports": true, "canManageSchedule": true}'::jsonb
        WHEN designation IN ('Professor', 'Associate Professor', 'Assistant Professor') THEN '{"canManageStudents": false, "canManageCourses": true, "canManageLabs": false, "canViewReports": false, "canManageSchedule": false}'::jsonb
        ELSE '{"canManageStudents": false, "canManageCourses": false, "canManageLabs": false, "canViewReports": false, "canManageSchedule": false}'::jsonb
    END
WHERE departmental_role IS NULL OR departmental_permissions IS NULL;

-- =====================================
-- 3.1. UPDATE COURSES TABLE
-- =====================================

-- Add department column to courses (if it doesn't exist)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';

-- Add index for course department lookup
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);

-- =====================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- =====================================

-- Add foreign key constraint for teacher department (if it doesn't exist)
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_teachers_department' 
        AND table_name = 'teachers'
    ) THEN
        -- First ensure all existing department values are valid
        UPDATE teachers SET department = 'General' 
        WHERE department NOT IN (SELECT code FROM departments);
        
        -- Then add the foreign key constraint
        ALTER TABLE teachers 
        ADD CONSTRAINT fk_teachers_department 
        FOREIGN KEY (department) REFERENCES departments(code);
    END IF;
END $$;

-- Update courses table to reference departments properly
DO $$
BEGIN
    -- Check if the foreign key constraint already exists for courses
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_courses_department' 
        AND table_name = 'courses'
    ) THEN
        -- First ensure all existing department values are valid
        UPDATE courses SET department = 'General' 
        WHERE department NOT IN (SELECT code FROM departments);
        
        -- Then add the foreign key constraint
        ALTER TABLE courses 
        ADD CONSTRAINT fk_courses_department 
        FOREIGN KEY (department) REFERENCES departments(code);
    END IF;
END $$;

-- =====================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================

-- Enable RLS for new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Allow all operations on departments') THEN
        CREATE POLICY "Allow all operations on departments" ON departments FOR ALL USING (true);
    END IF;
END $$;

-- Create policies for labs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'labs' AND policyname = 'Allow all operations on labs') THEN
        CREATE POLICY "Allow all operations on labs" ON labs FOR ALL USING (true);
    END IF;
END $$;

-- =====================================
-- 6. UPDATE VIEWS AND FUNCTIONS
-- =====================================

-- Create or replace view for teacher information with department details
CREATE OR REPLACE VIEW teacher_details AS
SELECT 
    t.*,
    d.name as department_name,
    d.description as department_description,
    d.head_of_department
FROM teachers t
LEFT JOIN departments d ON t.department = d.code;

-- Create or replace view for lab information with department details
CREATE OR REPLACE VIEW lab_details AS
SELECT 
    l.*,
    d.name as department_name,
    d.description as department_description
FROM labs l
LEFT JOIN departments d ON l.department_code = d.code;

-- =====================================
-- 7. INSERT SAMPLE LABS DATA
-- =====================================

-- Insert sample labs for different departments
INSERT INTO labs (custom_id, name, department_code, room_number, capacity, equipment, lab_type, operating_hours) VALUES
    ('LAB001', 'Programming Lab 1', 'CSE', 'CSE-101', 40, '["Computers", "Projector", "Whiteboard", "Air Conditioning"]', 'Computer Lab', '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}'),
    ('LAB002', 'Data Structures Lab', 'CSE', 'CSE-102', 35, '["Computers", "Projector", "Whiteboard"]', 'Computer Lab', '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}'),
    ('LAB003', 'Electronics Lab', 'ECE', 'ECE-201', 30, '["Oscilloscopes", "Function Generators", "Multimeters", "Breadboards", "Power Supplies"]', 'Hardware Lab', '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}'),
    ('LAB004', 'Digital Systems Lab', 'ECE', 'ECE-202', 30, '["Logic Analyzers", "FPGA Boards", "Computers", "Oscilloscopes"]', 'Hardware Lab', '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}'),
    ('LAB005', 'Physics Lab', 'Physics', 'PHY-101', 25, '["Microscopes", "Spectrometers", "Balance", "Measuring Instruments"]', 'Research Lab', '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}'),
    ('LAB006', 'Chemistry Lab', 'Chemistry', 'CHEM-101', 30, '["Fume Hoods", "Bunsen Burners", "Beakers", "Test Tubes", "Chemical Storage"]', 'Research Lab', '{"Monday": "9:00-17:00", "Tuesday": "9:00-17:00", "Wednesday": "9:00-17:00", "Thursday": "9:00-17:00", "Friday": "9:00-17:00", "Saturday": "9:00-13:00"}')
ON CONFLICT (custom_id) DO NOTHING;

-- =====================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DO $$
BEGIN
    -- Departments trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_departments_updated_at') THEN
        CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Labs trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_labs_updated_at') THEN
        CREATE TRIGGER update_labs_updated_at BEFORE UPDATE ON labs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================
-- MIGRATION COMPLETED
-- =====================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Database enhancement migration completed successfully at %', NOW();
    RAISE NOTICE 'Added: departments table with code as primary key';
    RAISE NOTICE 'Added: labs table with department assignment';
    RAISE NOTICE 'Enhanced: teachers table with departmental roles and permissions';
    RAISE NOTICE 'Created: views and foreign key constraints';
    RAISE NOTICE 'Inserted: sample data for departments and labs';
END $$;
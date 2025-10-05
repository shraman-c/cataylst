-- Catalyst Academic Management System Database Schema
-- Complete Supabase PostgreSQL schema for all application tables

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Programs table for academic programs
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    total_semesters INTEGER NOT NULL DEFAULT 8,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    program_id TEXT NOT NULL,
    current_semester INTEGER NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 8),
    electives JSONB DEFAULT '[]',
    credits INTEGER DEFAULT 0,
    enrolled_courses JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table with enhanced fields
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    teacher_id TEXT UNIQUE NOT NULL,
    subjects JSONB DEFAULT '[]',
    availability JSONB DEFAULT '{}',
    designation TEXT CHECK (designation IN ('Dean', 'HOD', 'Professor', 'Associate Professor', 'Assistant Professor')),
    qualification TEXT,
    working_hours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
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

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    is_lab BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    day TEXT NOT NULL,
    time_start TEXT NOT NULL,
    time_end TEXT NOT NULL,
    course_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change requests table
CREATE TABLE IF NOT EXISTS change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    requester_id TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    slot_id TEXT NOT NULL,
    request_details TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_id TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints and additional constraints for data integrity
-- Note: We use custom_id fields for foreign key relationships to match the application logic

-- Add constraint to ensure NEP course type is only set when course is NEP
ALTER TABLE courses ADD CONSTRAINT chk_nep_course_type_consistency 
    CHECK ((is_nep = false AND nep_course_type IS NULL) OR (is_nep = true));

-- Add constraint to ensure valid time format in timetables
ALTER TABLE timetables ADD CONSTRAINT chk_valid_time_format 
    CHECK (time_start ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' AND time_end ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$');

-- Add constraint to ensure valid day names
ALTER TABLE timetables ADD CONSTRAINT chk_valid_day 
    CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

-- Add constraint to ensure positive values
ALTER TABLE courses ADD CONSTRAINT chk_positive_credits CHECK (credits > 0);
ALTER TABLE courses ADD CONSTRAINT chk_positive_classes_per_week CHECK (classes_per_week > 0);
ALTER TABLE rooms ADD CONSTRAINT chk_positive_capacity CHECK (capacity > 0);
ALTER TABLE students ADD CONSTRAINT chk_positive_credits CHECK (credits >= 0);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_code ON programs(code);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id);
CREATE INDEX IF NOT EXISTS idx_students_current_semester ON students(current_semester);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
CREATE INDEX IF NOT EXISTS idx_courses_program_id ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
CREATE INDEX IF NOT EXISTS idx_courses_is_nep ON courses(is_nep);
CREATE INDEX IF NOT EXISTS idx_courses_nep_course_type ON courses(nep_course_type);
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);
CREATE INDEX IF NOT EXISTS idx_rooms_is_lab ON rooms(is_lab);
CREATE INDEX IF NOT EXISTS idx_timetables_day_time ON timetables(day, time_start);
CREATE INDEX IF NOT EXISTS idx_timetables_course_id ON timetables(course_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher_id ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_room_id ON timetables(room_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_requester_id ON change_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable Row Level Security (RLS) for better security (optional)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow all operations for now - customize as needed)
-- Note: Policies will be created only if they don't already exist
DO $$
BEGIN
    -- Programs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'programs' AND policyname = 'Allow all operations on programs') THEN
        CREATE POLICY "Allow all operations on programs" ON programs FOR ALL USING (true);
    END IF;
    
    -- Students policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Allow all operations on students') THEN
        CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);
    END IF;
    
    -- Teachers policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teachers' AND policyname = 'Allow all operations on teachers') THEN
        CREATE POLICY "Allow all operations on teachers" ON teachers FOR ALL USING (true);
    END IF;
    
    -- Courses policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Allow all operations on courses') THEN
        CREATE POLICY "Allow all operations on courses" ON courses FOR ALL USING (true);
    END IF;
    
    -- Rooms policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'Allow all operations on rooms') THEN
        CREATE POLICY "Allow all operations on rooms" ON rooms FOR ALL USING (true);
    END IF;
    
    -- Timetables policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'timetables' AND policyname = 'Allow all operations on timetables') THEN
        CREATE POLICY "Allow all operations on timetables" ON timetables FOR ALL USING (true);
    END IF;
    
    -- Change requests policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'change_requests' AND policyname = 'Allow all operations on change_requests') THEN
        CREATE POLICY "Allow all operations on change_requests" ON change_requests FOR ALL USING (true);
    END IF;
    
    -- Users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow all operations on users') THEN
        CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
    END IF;
END $$;

-- Create trigger function to update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables (with existence checks)
DO $$
BEGIN
    -- Programs trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_programs_updated_at') THEN
        CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Students trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_students_updated_at') THEN
        CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Teachers trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_teachers_updated_at') THEN
        CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Courses trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_courses_updated_at') THEN
        CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Rooms trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_rooms_updated_at') THEN
        CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Timetables trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_timetables_updated_at') THEN
        CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON timetables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Change requests trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_change_requests_updated_at') THEN
        CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Users trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================
-- HELPFUL VIEWS
-- =====================================

-- View for course details with complete information
CREATE OR REPLACE VIEW course_details AS
SELECT 
    c.id,
    c.course_code,
    c.course_name,
    c.credits,
    c.semester,
    c.is_nep,
    c.nep_course_type,
    c.description,
    c.created_at,
    c.updated_at,
    CASE 
        WHEN c.is_nep = true THEN 'NEP Course'
        ELSE 'Non-NEP Course'
    END as course_category,
    CASE 
        WHEN c.nep_course_type = 'MAJOR' THEN 'Major Core'
        WHEN c.nep_course_type = 'MINOR' THEN 'Minor'
        WHEN c.nep_course_type = 'MDC' THEN 'Multi-Disciplinary Course'
        WHEN c.nep_course_type = 'AEC' THEN 'Ability Enhancement Course'
        WHEN c.nep_course_type = 'SEC' THEN 'Skill Enhancement Course'
        WHEN c.nep_course_type = 'VAC' THEN 'Value Added Course'
        WHEN c.nep_course_type = 'OEC' THEN 'Open Elective Course'
        WHEN c.nep_course_type = 'IDC' THEN 'Inter-Disciplinary Course'
        WHEN c.nep_course_type = 'FC' THEN 'Foundation Course'
        WHEN c.nep_course_type = 'LC' THEN 'Language Course'
        ELSE 'Regular Course'
    END as nep_type_description
FROM courses c;

-- View for student details with program information
CREATE OR REPLACE VIEW student_details AS
SELECT 
    s.id,
    s.student_id,
    s.name,
    s.email,
    s.program_id,
    s.current_semester,
    s.created_at,
    s.updated_at,
    p.program_name,
    p.duration_years,
    p.total_semesters,
    CASE 
        WHEN s.current_semester <= p.total_semesters THEN 'Active'
        WHEN s.current_semester > p.total_semesters THEN 'Completed'
        ELSE 'Unknown'
    END as student_status
FROM students s
LEFT JOIN programs p ON s.program_id = p.id;

-- View for timetable details with complete schedule information
CREATE OR REPLACE VIEW timetable_details AS
SELECT 
    t.id,
    t.course_id,
    t.teacher_id,
    t.room_id,
    t.day_of_week,
    t.start_time,
    t.end_time,
    t.semester,
    t.created_at,
    t.updated_at,
    c.course_code,
    c.course_name,
    c.credits,
    c.is_nep,
    c.nep_course_type,
    te.name as teacher_name,
    te.email as teacher_email,
    te.department as teacher_department,
    r.room_number,
    r.building,
    r.capacity as room_capacity,
    r.room_type,
    EXTRACT(HOUR FROM (t.end_time - t.start_time)) as duration_hours
FROM timetables t
LEFT JOIN courses c ON t.course_id = c.id
LEFT JOIN teachers te ON t.teacher_id = te.id
LEFT JOIN rooms r ON t.room_id = r.id;

-- =====================================
-- UTILITY FUNCTIONS
-- =====================================

-- Function to get NEP course statistics
CREATE OR REPLACE FUNCTION get_nep_course_stats()
RETURNS TABLE (
    nep_course_type varchar(10),
    total_courses bigint,
    total_credits bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.nep_course_type,
        COUNT(*) as total_courses,
        SUM(c.credits) as total_credits
    FROM courses c
    WHERE c.is_nep = true
    GROUP BY c.nep_course_type
    ORDER BY total_courses DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get student program statistics
CREATE OR REPLACE FUNCTION get_program_stats()
RETURNS TABLE (
    program_name varchar(255),
    total_students bigint,
    avg_semester numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.program_name,
        COUNT(s.id) as total_students,
        ROUND(AVG(s.current_semester), 2) as avg_semester
    FROM programs p
    LEFT JOIN students s ON p.id = s.program_id
    GROUP BY p.id, p.program_name
    ORDER BY total_students DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================

COMMENT ON TABLE students IS 'Student information with program and semester tracking for NEP compliance';
COMMENT ON COLUMN students.program_id IS 'Foreign key reference to programs table for academic program tracking';
COMMENT ON COLUMN students.current_semester IS 'Current semester number for academic progress tracking';

COMMENT ON TABLE courses IS 'Course catalog with NEP (National Education Policy) categorization support';
COMMENT ON COLUMN courses.is_nep IS 'Boolean flag indicating if course follows NEP guidelines';
COMMENT ON COLUMN courses.nep_course_type IS 'NEP course category: MAJOR, MINOR, MDC, AEC, SEC, VAC, OEC, IDC, FC, LC';

COMMENT ON TABLE programs IS 'Academic programs/degrees offered by the institution';
COMMENT ON COLUMN programs.total_semesters IS 'Total number of semesters in the program duration';

COMMENT ON VIEW course_details IS 'Comprehensive view of courses with NEP categorization and descriptions';
COMMENT ON VIEW student_details IS 'Complete student information with program details and academic status';
COMMENT ON VIEW timetable_details IS 'Full timetable schedule with course, teacher, and room information';

COMMENT ON FUNCTION get_nep_course_stats IS 'Returns statistics about NEP courses grouped by type';
COMMENT ON FUNCTION get_program_stats IS 'Returns statistics about student enrollment by program';
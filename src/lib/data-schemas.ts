import { z } from 'zod';

// Add Department schema for department management
export const DepartmentSchema = z.object({
  code: z.string(), // Primary key - department code
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Add Lab schema for lab management under departments
export const LabSchema = z.object({
  id: z.string(),
  name: z.string(),
  labCode: z.string(),
  departmentCode: z.string(), // Foreign key to department
  capacity: z.number().min(1).max(100),
  equipment: z.array(z.string()).default([]),
  labIncharge: z.string().optional(), // Teacher ID
  isActive: z.boolean().default(true),
  location: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Add Program schema for multi-program support
export const ProgramSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  totalSemesters: z.number(),
  description: z.string().optional(),
  isNEP: z.boolean().default(false), // NEP designation for the program
});

// Add Section schema for section management
export const SectionSchema = z.object({
  id: z.string(),
  name: z.string(), // Section name like "A", "B", "C"
  programId: z.string(),
  semester: z.number().min(1).max(10),
  capacity: z.number().min(1).max(200),
  currentEnrollment: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  roomPreference: z.enum(['Classroom', 'Lab', 'Auditorium', 'Any']).optional(),
  academicYear: z.string().default('2024-25'),
});

export const CourseSchema = z.object({
  id: z.string(), // Primary key
  name: z.string(),
  department: z.string(),
  credits: z.number(),
  classesPerWeek: z.number(),
  isLab: z.boolean(),
  semester: z.number().min(1).max(8),
  isNEP: z.boolean().default(false),
  nepCourseType: z.enum([
    'Major', // Major Discipline Courses
    'Minor', // Minor Discipline Courses  
    'MDC', // Multidisciplinary Courses
    'AEC', // Ability Enhancement Courses
    'SEC', // Skill Enhancement Courses
    'VAC', // Value Added Courses
    'OEC', // Open Elective Courses
    'IDC', // Interdisciplinary Courses
    'FC', // Foundation Courses
    'LC' // Language Courses
  ]).optional(), // Only for NEP courses
});

export const StudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  studentId: z.string(),
  electives: z.array(z.string()),
  credits: z.number(),
  // Add program and semester support
  programId: z.string(), // Which program the student is enrolled in
  currentSemester: z.number().min(1).max(8), // Current semester
  enrolledCourses: z.array(z.string()).default([]), // Courses for this semester
  sectionId: z.string().optional(), // Which section the student is assigned to
  department: z.string(), // Department the student belongs to (e.g., "CSE", "ECE", "EEE", "MECH", "CIVIL")
  // Note: isNEP is determined by the program the student is enrolled in, not individually
});

export const TeacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  teacherId: z.string(),
  subjects: z.array(z.string()),
  availability: z.record(z.array(z.string())),
  designation: z.enum(['Dean', 'HOD', 'Professor', 'Associate Professor', 'Assistant Professor']).optional(),
  qualification: z.string().optional(),
  workingHours: z.string().optional(),
  department: z.string(), // Department the teacher belongs to (e.g., "CSE", "ECE", "EEE", "MECH", "CIVIL")
  // Departmental role and permissions
  departmentalRole: z.enum(['HOD', 'Teacher', 'Teaching Assistant', 'Lab Incharge']).default('Teacher'),
  departmentalPermissions: z.object({
    canManageStudents: z.boolean().default(false),
    canManageCourses: z.boolean().default(false),
    canManageLabs: z.boolean().default(false),
    canViewReports: z.boolean().default(false),
    canManageSchedule: z.boolean().default(false),
  }).default({
    canManageStudents: false,
    canManageCourses: false,
    canManageLabs: false,
    canViewReports: false,
    canManageSchedule: false,
  }),
  isActive: z.boolean().default(true),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  isLab: z.boolean(),
});

export const TimetableSlotSchema = z.object({
  id: z.string(),
  day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  timeStart: z.string(),
  timeEnd: z.string(),
  courseId: z.string(),
  teacherId: z.string(),
  roomId: z.string(),
  // Add semester and program context
  semester: z.number().min(1).max(8),
  programId: z.string(),
  section: z.string().default("A"), // For multiple sections per semester
});

// Schema for semester-wise timetable generation
export const SemesterTimetableGenerationSchema = z.object({
  programId: z.string(),
  semester: z.number().min(1).max(8),
  section: z.string().default("A"),
  includeElectives: z.boolean().default(true),
});

// Schema for multi-program timetable generation
export const MultiProgramTimetableGenerationSchema = z.object({
  programs: z.array(z.object({
    programId: z.string(),
    semesters: z.array(z.number().min(1).max(8)),
    sections: z.array(z.string()).default(["A"]),
  })),
  includeElectives: z.boolean().default(true),
});

// Schema for the change request itself
export const ChangeRequestSchema = z.object({
    _id: z.string(),
    requesterId: z.string(),
    requesterName: z.string(),
    slotId: z.string(),
    requestDetails: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
    createdAt: z.date(),
});

export const UpdateChangeRequestSchema = z.object({
    status: z.enum(['approved', 'rejected']),
});

// --- Flow Schemas ---

export const GenerateTimetableInputSchema = z.object({
  students: z.array(StudentSchema),
  teachers: z.array(TeacherSchema),
  courses: z.array(CourseSchema),
  rooms: z.array(RoomSchema),
  programs: z.array(ProgramSchema),
  // Add semester-wise generation options
  generationMode: z.enum(['single-semester', 'multi-semester', 'full-program']).default('single-semester'),
  targetSemester: z.number().min(1).max(8).optional(),
  targetProgramId: z.string().optional(),
  targetSection: z.string().default("A"),
});
export type GenerateTimetableInput = z.infer<typeof GenerateTimetableInputSchema>;

export const GenerateTimetableOutputSchema = z.object({
  timetable: z.array(TimetableSlotSchema),
  metadata: z.object({
    generatedFor: z.object({
      programs: z.array(z.string()),
      semesters: z.array(z.number()),
      sections: z.array(z.string()),
    }),
    conflictsResolved: z.number(),
    totalSlots: z.number(),
    generationTime: z.number(), // in milliseconds
  }),
});
export type GenerateTimetableOutput = z.infer<typeof GenerateTimetableOutputSchema>;

// Export Department type
export type Department = z.infer<typeof DepartmentSchema>;

// Export Lab type
export type Lab = z.infer<typeof LabSchema>;

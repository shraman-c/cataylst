import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { StudentSchema, TeacherSchema } from '@/lib/data-schemas';
import { createSupabaseAuthClient, toSupabaseEmail } from '@/lib/supabase-auth';
import { hasRegistryAccount, readAccountRegistry, writeAccountRegistry } from '@/lib/auth-registry';

// File paths
const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');
const teachersFilePath = path.join(process.cwd(), 'src', 'lib', 'teachers.json');

// Helper functions
async function readJsonFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeJsonFile(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(prefix: string, existingItems: any[]): string {
  // Collect existing numeric suffixes from items whose id starts with the prefix (e.g., S001)
  const existingIdNumbers: number[] = existingItems
    .map(item => (item.id || '').toString())
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.slice(prefix.length), 10))
    .filter(n => !Number.isNaN(n));

  let counter = 1;
  if (existingIdNumbers.length > 0) {
    counter = Math.max(...existingIdNumbers) + 1;
  }

  return `${prefix}${counter.toString().padStart(3, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userType, name, password, ...restUserData } = body;
    const registry = await readAccountRegistry();

    // Validation
    if (!userType || !name || !password) {
      return NextResponse.json({ 
        error: 'User type, name, and password are required' 
      }, { status: 400 });
    }

    if (!['student', 'teacher'].includes(userType)) {
      return NextResponse.json({ 
        error: 'Invalid user type. Must be student or teacher' 
      }, { status: 400 });
    }

    if (userType === 'student') {
      // Handle student registration
      const { studentId, electives = [], credits = 0, programId, currentSemester, department, enrolledCourses = [], sectionId } = restUserData;
      
      if (!studentId) {
        return NextResponse.json({ 
          error: 'Student ID is required' 
        }, { status: 400 });
      }

      // Read existing data
      const students = await readJsonFile(studentsFilePath);
      const email = toSupabaseEmail(studentId);
      const studentDataId = generateId('S', students);

      // Check if student ID already exists
      if (students.some((s: any) => s.studentId === studentId)) {
        return NextResponse.json({ 
          error: 'Student ID already exists' 
        }, { status: 400 });
      }

      // Check if username already exists
      if (hasRegistryAccount(registry, { profileId: studentDataId, username: studentId, email })) {
        return NextResponse.json({ 
          error: 'Username already exists' 
        }, { status: 400 });
      }

      // Create student data (include program/semester/department if provided)
      const studentData: any = {
        id: studentDataId,
        name,
        studentId,
        electives,
        credits,
        programId: programId || '',
        currentSemester: typeof currentSemester === 'number' ? currentSemester : undefined,
        enrolledCourses: Array.isArray(enrolledCourses) ? enrolledCourses : [],
        sectionId: sectionId || undefined,
        department: department || ''
      };

      // Validate student data
      try {
        StudentSchema.parse(studentData);
      } catch (validationError) {
        return NextResponse.json({ 
          error: 'Invalid student data', 
          details: validationError 
        }, { status: 400 });
      }

        const userMetadata = {
          name,
          role: 'student',
          username: studentId,
          profileId: studentDataId,
        };

        const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseAdminClient()
          : createSupabaseAuthClient();

        const { data: authData, error: authError } = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: userMetadata,
            })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: userMetadata,
              },
            });

      if (authError || !authData.user) {
        return NextResponse.json({
          error: authError?.message || 'Failed to create Supabase user'
        }, { status: 400 });
      }

      // Save both files
      students.push(studentData);

      await writeJsonFile(studentsFilePath, students);
      await writeAccountRegistry([
        ...registry,
        {
          id: studentDataId,
          profileId: studentDataId,
          authUserId: authData.user.id,
          username: studentId,
          email,
          name,
          role: 'student',
        },
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Student registered successfully',
        student: studentData,
        user: { id: studentDataId, username: studentId, name, role: 'student' }
      });

    } else if (userType === 'teacher') {
      // Handle teacher registration
      const { teacherId, subjects = [], designation = 'Assistant Professor', availability = {}, department } = restUserData;

      if (!teacherId) {
        return NextResponse.json({ 
          error: 'Teacher ID is required' 
        }, { status: 400 });
      }
      if (!department) {
        return NextResponse.json({ 
          error: 'Department is required' 
        }, { status: 400 });
      }
      if (subjects.length === 0) {
        return NextResponse.json({ 
          error: 'At least one subject is required' 
        }, { status: 400 });
      }

      // Read existing data
      const teachers = await readJsonFile(teachersFilePath);
      const email = toSupabaseEmail(teacherId);

      // Check if teacher ID already exists
      if (teachers.some((t: any) => t.teacherId === teacherId)) {
        return NextResponse.json({ 
          error: 'Teacher ID already exists' 
        }, { status: 400 });
      }

      // Check if username already exists
      if (hasRegistryAccount(registry, { profileId: teacherId, username: teacherId, email })) {
        return NextResponse.json({ 
          error: 'Username already exists' 
        }, { status: 400 });
      }

      // Set teacherData.id to teacherId for portal compatibility
      const teacherData = {
        id: teacherId, // id must match userId for teacher portal
        name,
        teacherId,
        subjects,
        availability,
        designation,
        department,
        // Use default values for departmentalRole and departmentalPermissions
        departmentalRole: 'Teacher',
        departmentalPermissions: {
          canManageStudents: false,
          canManageCourses: false,
          canManageLabs: false,
          canViewReports: false,
          canManageSchedule: false,
        },
        isActive: true,
      };

      // Validate teacher data
      try {
        TeacherSchema.parse(teacherData);
      } catch (validationError) {
        return NextResponse.json({ 
          error: 'Invalid teacher data', 
          details: validationError 
        }, { status: 400 });
      }

        const userMetadata = {
          name,
          role: 'teacher',
          username: teacherId,
          profileId: teacherId,
        };

        const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseAdminClient()
          : createSupabaseAuthClient();

        const { data: authData, error: authError } = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? await supabase.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: userMetadata,
            })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: userMetadata,
              },
            });

      if (authError || !authData.user) {
        return NextResponse.json({
          error: authError?.message || 'Failed to create Supabase user'
        }, { status: 400 });
      }

      // Save both files
      teachers.push(teacherData);

      await writeJsonFile(teachersFilePath, teachers);
      await writeAccountRegistry([
        ...registry,
        {
          id: teacherId,
          profileId: teacherId,
          authUserId: authData.user.id,
          username: teacherId,
          email,
          name,
          role: 'teacher',
        },
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Teacher registered successfully',
        teacher: teacherData,
        user: { id: teacherId, username: teacherId, name, role: 'teacher' }
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during registration' 
    }, { status: 500 });
  }
}
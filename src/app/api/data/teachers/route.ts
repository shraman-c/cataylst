
import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

import { getAll, insertMany, deleteOne, update, collections } from '@/server/neon';

import { TeacherSchema } from '@/lib/data-schemas';

const teachersFilePath = path.join(process.cwd(), 'src', 'lib', 'teachers.json');

// Transform database format back to frontend format
function transformTeachersFromDB(dbTeachers: any[]) {
  return dbTeachers.map(teacher => ({
    id: teacher.custom_id,
    name: teacher.name,
    teacherId: teacher.teacher_id,
    subjects: teacher.subjects || [],
    availability: typeof teacher.availability === 'string' ? JSON.parse(teacher.availability) : (teacher.availability || {}),
    department: teacher.department || 'CSE',
    designation: teacher.designation || 'Assistant Professor',
    departmentalRole: 'Teacher',
    departmentalPermissions: {
      canManageStudents: false,
      canManageCourses: false,
      canManageLabs: false,
      canViewReports: false,
      canManageSchedule: false,
    },
    isActive: true
  }));
}

async function getTeachers() {
  try {
    // Get from Neon database only
    const data = await getAll('teachers');

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform database format to frontend format
    return transformTeachersFromDB(data);
  } catch (error) {
    console.log('Database error, falling back to file:', error);
    try {
      const fileData = await fs.readFile(teachersFilePath, 'utf-8');
      return JSON.parse(fileData);
    } catch (fileError) {
      if ((fileError as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      console.error('Both database and file failed:', fileError);
      throw fileError;
    }
  }
}

async function saveTeachers(data: any) {
  try {
    // Save to Neon database - transform to database format
    if (data.length > 0) {
      const dbData = data.map((teacher: any) => ({
        custom_id: teacher.id,
        name: teacher.name,
        teacher_id: teacher.teacherId,
        subjects: teacher.subjects,
        availability: teacher.availability,
        department: teacher.department,
        designation: teacher.designation
      }));
      await insertMany('teachers', dbData);
    }
    
    console.log(`✅ Saved ${data.length} teachers to database`);
  } catch (error) {
    console.error('Error saving teachers to database:', error);
    throw error;
  }
}


export async function GET(req: NextRequest) {
  try {
    const data = await getTeachers();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teachers data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    // Handle single teacher creation
    if (!body.data && body.id) {
      // Set default permissions based on role
      const defaultPermissions = {
        HOD: {
          canManageStudents: true,
          canManageCourses: true,
          canManageLabs: true,
          canViewReports: true,
          canManageSchedule: true
        },
        'Teacher': {
          canManageStudents: false,
          canManageCourses: true,
          canManageLabs: false,
          canViewReports: false,
          canManageSchedule: false
        },
        'Teaching Assistant': {
          canManageStudents: false,
          canManageCourses: false,
          canManageLabs: false,
          canViewReports: false,
          canManageSchedule: false
        },
        'Lab Incharge': {
          canManageStudents: false,
          canManageCourses: false,
          canManageLabs: true,
          canViewReports: false,
          canManageSchedule: false
        }
      };

      // Handle subjects array properly
      const subjects = Array.isArray(body.subjects) ? body.subjects : String(body.subjects || '').split(',').map(sub => sub.trim()).filter(Boolean);
      
      const teacherData = {
        ...body,
        subjects: subjects,
        departmentalPermissions: defaultPermissions[body.departmentalRole as keyof typeof defaultPermissions] || defaultPermissions['Teacher']
      };

      const parsed = TeacherSchema.safeParse(teacherData);
      if (!parsed.success) {
        return NextResponse.json({ 
          error: 'Validation failed', 
          details: parsed.error.flatten() 
        }, { status: 400 });
      }

      const teachers = await getTeachers();
      
      // Check if teacher with same ID already exists
      if (teachers.find((t: any) => t.id === body.id)) {
        return NextResponse.json({ error: 'Teacher with this ID already exists' }, { status: 400 });
      }

      teachers.push(parsed.data);
      await saveTeachers(teachers);
      
      return NextResponse.json({ success: true, teacher: parsed.data });
    }

    // Handle bulk upload (existing logic)
    const { data } = body;
    if (!Array.isArray(data)) {
        return NextResponse.json({ error: 'Invalid data format, expected an array.' }, { status: 400 });
    }
    
  // Load courses.json for code-to-name mapping
  const coursesPath = path.join(process.cwd(), 'src', 'lib', 'courses.json');
  let courses = [];
  try {
    const coursesRaw = await fs.readFile(coursesPath, 'utf-8');
    courses = JSON.parse(coursesRaw);
  } catch (e) {
    console.error('Could not load courses.json for subject mapping', e);
  }
  const codeToName = Object.fromEntries(courses.map((c: any) => [c.id, c.name]));

  const validatedData = data.map(item => {
    let availability = {};
    try {
      if (typeof item.availability === 'string') {
        availability = JSON.parse(item.availability);
      } else if (typeof item.availability === 'object') {
        availability = item.availability;
      }
    } catch(e) {
      console.error("Could not parse availability for teacher:", item);
      // Default availability for all weekdays
      availability = {
        "Monday": ["09:30-17:30"],
        "Tuesday": ["09:30-17:30"],
        "Wednesday": ["09:30-17:30"],
        "Thursday": ["09:30-17:30"],
        "Friday": ["09:30-17:30"],
        "Saturday": ["09:30-12:30"]
      };
    }

    // Accept subject codes, store as array of strings (codes only)
    const subjects = Array.isArray(item.subjects)
      ? item.subjects.map((s: string) => s.trim())
      : String(item.subjects || '').split(',').map((s: string) => s.trim()).filter(Boolean);

    // Helper function to convert to boolean
    const convertToBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === '1' || lower === 'yes';
      }
      return Boolean(value);
    };

    const parsed = TeacherSchema.safeParse({
      ...item,
      subjects: subjects,
      availability: availability,
      isActive: convertToBoolean(item.isActive),
      department: item.department || 'CSE',
      designation: item.designation || 'Assistant Professor',
      departmentalRole: 'Teacher',
      departmentalPermissions: {
        canManageStudents: false,
        canManageCourses: false,
        canManageLabs: false,
        canViewReports: false,
        canManageSchedule: false,
      }
    });

    if (!parsed.success) {
      console.error("CSV validation error for item:", item, parsed.error.flatten());
      return null;
    }
    return parsed.data;
  }).filter(Boolean);

    if (validatedData.length === 0 && data.length > 0) {
        return NextResponse.json({ error: 'No valid data to import. Please check CSV format.' }, { status: 400 });
    }

    await saveTeachers(validatedData);

    return NextResponse.json({ success: true, importedCount: validatedData.length });
  } catch (error) {
    console.error("Error updating teachers:", error);
    return NextResponse.json({ error: 'Failed to update teachers data' }, { status: 500 });
  }
}

// PUT /api/data/teachers - Update a single teacher
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Validate the teacher data
    const validatedData = TeacherSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validatedData.error.flatten() 
      }, { status: 400 });
    }

    // Transform to database format
    const dbData = {
      custom_id: validatedData.data.id,
      name: validatedData.data.name,
      teacher_id: validatedData.data.teacherId,
      subjects: validatedData.data.subjects,
      availability: validatedData.data.availability,
      department: validatedData.data.department,
      designation: validatedData.data.designation
    };

    // Update the teacher
    const updatedTeacher = await update('teachers', teacherId, dbData);
    
    if (!updatedTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Transform back to frontend format
    const responseData = transformTeachersFromDB([updatedTeacher])[0];

    return NextResponse.json({ message: 'Teacher updated successfully', teacher: responseData });
  } catch (error) {
    console.error('Failed to update teacher:', error);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}

// DELETE /api/data/teachers - Delete a teacher
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Delete the teacher from database
    const deleted = await deleteOne('teachers', teacherId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Teacher deleted successfully', deletedTeacherId: teacherId });
  } catch (error) {
    console.error('Failed to delete teacher:', error);
    return NextResponse.json({ error: 'Failed to delete teacher' }, { status: 500 });
  }
}

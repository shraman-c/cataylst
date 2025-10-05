import { NextRequest, NextResponse } from 'next/server';
import { getAll, update } from '@/server/neon';
import { TeacherSchema } from '@/lib/data-schemas';

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
    console.error('Error getting teachers:', error);
    throw error;
  }
}

// PUT /api/data/teachers/availability
// Body: { teacherId: string (internal id), availability: Record<Day, string[]> }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, availability } = body;

    if (!teacherId || !availability || typeof availability !== 'object') {
      return NextResponse.json({ error: 'teacherId and availability object are required' }, { status: 400 });
    }

    const teachers = await getTeachers();
    const teacher = teachers.find((t: any) => t.id === teacherId);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Validate partial teacher with updated availability
    const candidate = { ...teacher, availability };
    const parsed = TeacherSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid availability format', details: parsed.error.flatten() }, { status: 400 });
    }

    // Update in database using the custom_id (which maps to teacherId)
    const updateResult = await update('teachers', teacherId, { 
      availability: JSON.stringify(availability) 
    });

    if (!updateResult) {
      return NextResponse.json({ error: 'Failed to update teacher availability' }, { status: 500 });
    }

    return NextResponse.json({ success: true, teacher: parsed.data });
  } catch (e: any) {
    console.error('Availability update failed:', e);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}

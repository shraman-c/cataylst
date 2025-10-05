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

// POST /api/data/teachers/fill-all-availability
// Fills all teachers' availability with full day for all days
export async function POST(req: NextRequest) {
  try {
    const teachers = await getTeachers();
    const fullDay = ['09:30-17:30'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let updatedCount = 0;
    
    // Update each teacher's availability in the database
    for (const teacher of teachers) {
      const newAvailability: Record<string, string[]> = {};
      days.forEach(day => { newAvailability[day] = [...fullDay]; });
      const candidate = { ...teacher, availability: newAvailability };
      const parsed = TeacherSchema.safeParse(candidate);
      
      if (parsed.success) {
        // Update in database using the teacher's id (which maps to custom_id)
        await update('teachers', teacher.id, { 
          availability: JSON.stringify(newAvailability) 
        });
        updatedCount++;
      }
    }
    
    return NextResponse.json({ success: true, updatedCount });
  } catch (e: any) {
    console.error('Fill all availability failed:', e);
    return NextResponse.json({ error: 'Failed to fill all availability' }, { status: 500 });
  }
}
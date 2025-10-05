import { NextRequest, NextResponse } from 'next/server';
import { update, find } from '@/server/neon';

// PUT /api/data/students/update
// Body: { studentId: string, updates: Partial<Student> }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, updates } = body;

    if (!studentId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'studentId and updates object are required' }, { status: 400 });
    }

    // First check if the student exists
    const existingStudents = await find('students', { where: `custom_id = '${studentId}'` });
    
    if (!existingStudents || existingStudents.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Transform frontend field names to database field names
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.studentId !== undefined) dbUpdates.student_id = updates.studentId;
    if (updates.programId !== undefined) dbUpdates.program_id = updates.programId;
    if (updates.currentSemester !== undefined) dbUpdates.current_semester = updates.currentSemester;
    if (updates.sectionId !== undefined) dbUpdates.section_id = updates.sectionId;
    if (updates.electives !== undefined) dbUpdates.electives = updates.electives;
    if (updates.department !== undefined) dbUpdates.department = updates.department;

    // Perform the update
    const updatedStudent = await update('students', studentId, dbUpdates);
    
    if (!updatedStudent) {
      return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Student updated successfully`,
      student: {
        id: updatedStudent.custom_id,
        name: updatedStudent.name,
        studentId: updatedStudent.student_id,
        programId: updatedStudent.program_id,
        currentSemester: updatedStudent.current_semester,
        sectionId: updatedStudent.section_id,
        electives: updatedStudent.electives || [],
        department: updatedStudent.department || 'CSE'
      }
    });
    
  } catch (error: any) {
    console.error('Student update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { deleteOne, find } from '@/server/neon';

// DELETE /api/data/students/delete
// Body: { studentId: string }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId } = body;

    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // First check if the student exists
    const existingStudents = await find('students', { where: `custom_id = '${studentId}'` });
    
    if (!existingStudents || existingStudents.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentToDelete = existingStudents[0];

    // Perform the deletion
    const deleted = await deleteOne('students', studentId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Student "${studentToDelete.name}" deleted successfully`
    });
    
  } catch (error: any) {
    console.error('Student delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/neon';

// DELETE /api/data/teachers/delete
// Body: { teacherId: string }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId } = body;

    if (!teacherId || typeof teacherId !== 'string') {
      return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
    }

    try {
      // Try database first - if available
      const existingTeacher = await query(`SELECT id, name FROM teachers WHERE id = '${teacherId}'`);
      
      if (existingTeacher && existingTeacher.length > 0) {
        // Check for dependencies in timetable
        const dependencies = await query(`SELECT _id FROM timetables WHERE "teacherId" = '${teacherId}'`);
        
        if (dependencies && dependencies.length > 0) {
          return NextResponse.json({ 
            error: 'Cannot delete teacher', 
            reason: 'Teacher is assigned to timetable entries',
            dependencies: dependencies.length
          }, { status: 409 });
        }
        
        const deleteResult = await query(`DELETE FROM teachers WHERE id = '${teacherId}' RETURNING name`);
        
        if (deleteResult && deleteResult.length > 0) {
          return NextResponse.json({ 
            success: true, 
            message: `Teacher "${existingTeacher[0].name}" deleted successfully`,
            deletedTeacherId: teacherId
          });
        }
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 });
    }
    
    // If we reach here, teacher was not found
    return NextResponse.json({ 
      error: 'Teacher not found', 
      teacherId 
    }, { status: 404 });
  } catch (error: any) {
    console.error('Teacher delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/neon';

// DELETE /api/data/courses/delete
// Body: { courseId: string }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId } = body;

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    try {
      // First, check if the course exists
      const existingCourse = await query(`SELECT custom_id, name FROM courses WHERE custom_id = '${courseId}'`);

      if (!existingCourse || existingCourse.length === 0) {
        console.error(`Course not found with ID: ${courseId}`);
        return NextResponse.json({ 
          error: 'Course not found', 
          courseId 
        }, { status: 404 });
      }

      // Check for dependencies (timetable entries)
      const timetableEntries = await query(`SELECT id FROM timetables WHERE course_id = '${courseId}'`);

      if (timetableEntries && timetableEntries.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete course', 
          reason: 'Course is used in timetable entries',
          dependencies: timetableEntries.length
        }, { status: 409 });
      }

      // Delete the course
      const deleteResult = await query(`DELETE FROM courses WHERE custom_id = '${courseId}' RETURNING name`);

      if (deleteResult && deleteResult.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: `Course "${existingCourse[0].name}" deleted successfully`,
          deletedCourseId: courseId
        });
      } else {
        return NextResponse.json({ 
          error: 'Failed to delete course', 
          details: 'No rows affected' 
        }, { status: 500 });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Course delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
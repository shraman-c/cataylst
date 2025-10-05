import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/neon';

// PUT /api/data/courses/update
// Body: { courseId: string, updates: Partial<Course> }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, updates } = body;

    // Universal type fixer for all course fields
    function fixTypes(row: Record<string, any>) {
      const fixed: Record<string, any> = {};
      // List of fields that must be numbers
      const numberFields = ['credits', 'classesPerWeek', 'semester', 'currentSemester', 'capacity', 'currentEnrollment', 'totalSemesters'];
      for (const key in row) {
        let val = row[key];
        if (typeof val === 'string') {
          if (val.trim().toLowerCase() === 'true') {
            val = true;
          } else if (val.trim().toLowerCase() === 'false') {
            val = false;
          } else if (!isNaN(Number(val)) && val.trim() !== '' && /^\d+(\.\d+)?$/.test(val)) {
            val = Number(val);
          } else if (val.startsWith('[') && val.endsWith(']')) {
            try { val = JSON.parse(val); } catch {}
          } else if (val === '') {
            val = undefined;
          }
        }
        // For number fields, always coerce to number if value is string or boolean
        if (numberFields.includes(key) && val !== undefined && val !== '') {
          if (typeof val === 'boolean') {
            val = val ? 1 : 0;
          } else if (typeof val === 'string' || typeof val === 'number') {
            val = Number(val);
          }
        }
        if (val !== undefined) fixed[key] = val;
      }
      return fixed;
    }

    const fixedUpdates = fixTypes(updates);

    if (!courseId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'courseId and updates object are required' }, { status: 400 });
    }

    // Try to update in Neon database first
    try {
      // Check if course exists
      const existingCourse = await query(`SELECT * FROM courses WHERE custom_id = '${courseId}'`);
      
      if (existingCourse && existingCourse.length > 0) {
        // Prepare update data - only fields in new schema
        const updateData: any = {};
        if (fixedUpdates.name !== undefined) updateData.name = fixedUpdates.name;
        if (fixedUpdates.department !== undefined) updateData.department = fixedUpdates.department;
        if (fixedUpdates.credits !== undefined) updateData.credits = fixedUpdates.credits;
        if (fixedUpdates.classesPerWeek !== undefined) updateData.classes_per_week = fixedUpdates.classesPerWeek;
        if (fixedUpdates.isLab !== undefined) updateData.is_lab = fixedUpdates.isLab;
        if (fixedUpdates.semester !== undefined) updateData.semester = fixedUpdates.semester;
        if (fixedUpdates.isNEP !== undefined) updateData.is_nep = fixedUpdates.isNEP;
        if (fixedUpdates.nepCourseType !== undefined) updateData.nep_course_type = fixedUpdates.nepCourseType;

        // Build dynamic update query
        const updateFields = Object.entries(updateData)
          .map(([key, value]) => `${key} = '${value}'`)
          .join(', ');

        if (updateFields) {
          const updateQuery = `UPDATE courses SET ${updateFields} WHERE custom_id = '${courseId}' RETURNING *`;
          const updatedRows = await query(updateQuery);
          
          if (updatedRows && updatedRows.length > 0) {
            const updated = updatedRows[0];
            // Return updated course in frontend format
            return NextResponse.json({ 
              success: true, 
              course: {
                id: updated.custom_id,  // Use custom_id as frontend id
                name: updated.name,
                department: updated.department,
                credits: updated.credits,
                classesPerWeek: updated.classes_per_week,
                isLab: updated.is_lab,
                semester: updated.semester,
                isNEP: updated.is_nep,
                nepCourseType: updated.nep_course_type
              }
            });
          }
        }
      }
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      return NextResponse.json({ 
        error: 'Database update failed', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 });
    }
    
    // If we reach here, course was not found
    return NextResponse.json({ 
      error: 'Course not found', 
      courseId 
    }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error?.message || String(error) }, { status: 500 });
  }
}
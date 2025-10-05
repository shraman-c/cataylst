
import { NextRequest, NextResponse } from 'next/server';
import { getAll, insertMany, deleteOne, update, collections } from '@/server/neon';
import { CourseSchema } from '@/lib/data-schemas';

// Transform database format back to frontend format
function transformCoursesFromDB(dbCourses: any[]) {
  return dbCourses.map(course => ({
    id: course.custom_id,  // Use custom_id as the frontend id
    name: course.name,
    department: course.department || 'General',
    credits: course.credits || 0,
    classesPerWeek: course.classes_per_week || 1,
    isLab: course.is_lab || false,
    semester: course.semester || 1,
    isNEP: course.is_nep || false,
    nepCourseType: course.nep_course_type
  }));
}

async function getCourses() {
  try {
    // Get from Neon database only
    const data = await getAll('courses');
    console.log('[DEBUG] Neon raw data:', data);
    
    if (data && Array.isArray(data)) {
      console.log('[DEBUG] Returning transformed Neon data');
      return transformCoursesFromDB(data);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting courses from database:', error);
    throw error;
  }
}

async function saveCourses(data: any) {
  try {
    // Save to Neon database - transform to database format to match insertMany expectations
    if (data.length > 0) {
      console.log('Processing courses data:', data);
      const dbData = data.map((course: any) => ({
        custom_id: course.id,  // Map id to custom_id (database column name)
        name: course.name,
        department: course.department,
        credits: course.credits,
        classes_per_week: course.classesPerWeek,  // Convert to snake_case (database column name)
        is_lab: course.isLab,  // Convert to snake_case (database column name)
        semester: course.semester,
        program_id: course.programId || 'BTCSE',  // Convert to snake_case and default
        is_nep: course.isNEP,  // Convert to snake_case (database column name)
        nep_course_type: course.nepCourseType  // Convert to snake_case (database column name)
      }));
      console.log('Transformed data for insertMany:', dbData);
      await insertMany('courses', dbData);
    }
    
    console.log(`✅ Saved ${data.length} courses to database`);
  } catch (error) {
    console.error('Error saving courses to database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}


export async function GET(req: NextRequest) {
  try {
    const data = await getCourses();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses data' }, { status: 500 });
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
    const { data } = body;
    if (!Array.isArray(data)) {
        return NextResponse.json({ error: 'Invalid data format, expected an array.' }, { status: 400 });
    }
    
    // Universal type fixer for all course fields
    function fixTypes(row: Record<string, any>) {
      const fixed: Record<string, any> = {};
      // List of fields that must be numbers
      const numberFields = ['credits', 'classesPerWeek', 'semester', 'currentSemester', 'capacity', 'currentEnrollment', 'totalSemesters'];
      // List of fields that must be booleans
      const booleanFields = ['isLab', 'isElective', 'isNEP'];
      
      // Helper function to convert to boolean
      const convertToBoolean = (value: any): boolean => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase().trim();
          return lower === 'true' || lower === '1' || lower === 'yes';
        }
        return Boolean(value);
      };

      for (const key in row) {
        let val = row[key];
        if (typeof val === 'string') {
          val = val.trim();
          if (val === '') {
            val = undefined;
          } else if (booleanFields.includes(key)) {
            val = convertToBoolean(val);
          } else if (val.toLowerCase() === 'true') {
            val = true;
          } else if (val.toLowerCase() === 'false') {
            val = false;
          } else if (!isNaN(Number(val)) && /^\d+(\.\d+)?$/.test(val)) {
            val = Number(val);
          } else if (val.startsWith('[') && val.endsWith(']')) {
            try { val = JSON.parse(val); } catch {}
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
        // For boolean fields, ensure proper boolean conversion
        if (booleanFields.includes(key) && val !== undefined) {
          val = convertToBoolean(val);
        }
        if (val !== undefined) fixed[key] = val;
      }
      
      // Set defaults for required fields
      fixed.department = fixed.department || 'CSE';
      fixed.programId = fixed.programId || 'BTCSE';
      fixed.isElective = fixed.isElective || false;
      fixed.prerequisiteCourses = fixed.prerequisiteCourses || [];
      
      return fixed;
    }

    // Validate and transform data before insertion
    const validatedData = data.map(item => {
        const parsed = CourseSchema.safeParse(fixTypes(item));
        if (!parsed.success) {
            console.error("CSV validation error for item:", item, parsed.error.flatten());
            // Skip invalid items or throw an error
            return null;
        }
        return parsed.data;
    }).filter(Boolean); // Filter out null values from failed parsing

    if (validatedData.length === 0 && data.length > 0) {
        return NextResponse.json({ error: 'No valid data to import. Please check CSV format.' }, { status: 400 });
    }

    // Save new data
    await saveCourses(validatedData);
    
    return NextResponse.json({ success: true, importedCount: validatedData.length });
  } catch (error) {
    console.error("Error updating courses:", error);
    return NextResponse.json({ error: 'Failed to update courses data' }, { status: 500 });
  }
}

// PUT /api/data/courses - Update a single course
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Validate the course data
    const validatedData = CourseSchema.safeParse(body);
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
      department: validatedData.data.department,
      credits: validatedData.data.credits,
      classes_per_week: validatedData.data.classesPerWeek,
      is_lab: validatedData.data.isLab,
      semester: validatedData.data.semester,
      program_id: 'BTCSE', // Default program
      is_nep: validatedData.data.isNEP,
      nep_course_type: validatedData.data.nepCourseType
    };

    // Update the course
    const updatedCourse = await update('courses', courseId, dbData);
    
    if (!updatedCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Transform back to frontend format
    const responseData = {
      id: updatedCourse.custom_id,
      name: updatedCourse.name,
      department: updatedCourse.department || 'General',
      credits: updatedCourse.credits || 0,
      classesPerWeek: updatedCourse.classes_per_week || 1,
      isLab: updatedCourse.is_lab || false,
      semester: updatedCourse.semester || 1,
      isNEP: updatedCourse.is_nep || false,
      nepCourseType: updatedCourse.nep_course_type
    };

    return NextResponse.json({ message: 'Course updated successfully', course: responseData });
  } catch (error) {
    console.error('Failed to update course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE /api/data/courses - Delete a course
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Delete the course from database
    const deleted = await deleteOne('courses', courseId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Failed to delete course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}

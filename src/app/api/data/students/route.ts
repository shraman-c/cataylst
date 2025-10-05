
import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

import { getAll, insertMany, deleteOne, update, collections } from '@/server/neon';

import { StudentSchema } from '@/lib/data-schemas';

const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');

// Transform database format back to frontend format
function transformStudentsFromDB(dbStudents: any[]) {
  return dbStudents.map(student => ({
    id: student.custom_id,
    name: student.name,
    studentId: student.student_id,
    programId: student.program_id,
    currentSemester: student.current_semester,
    sectionId: student.section_id,
    electives: student.electives || [],
    credits: 0, // Not stored in DB yet
    enrolledCourses: [], // Not stored in DB yet
    department: student.department || 'CSE'
    // Note: isNEP is determined by the program, not stored per student
  }));
}

async function getStudents() {
  try {
    // First try to get from Neon database
    const data = await getAll('students');

    // Transform database format to frontend format
    return transformStudentsFromDB(data);
  } catch (error) {
    console.log('Database error, falling back to file:', error);
    try {
      const fileData = await fs.readFile(studentsFilePath, 'utf-8');
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

async function saveStudents(data: any) {
  try {
    // Save to Neon database - transform to database format
    if (data.length > 0) {
      const dbData = data.map((student: any) => ({
        custom_id: student.id,
        name: student.name,
        student_id: student.studentId,
        program_id: student.programId,
        current_semester: student.currentSemester,
        section_id: student.sectionId,
        electives: student.electives,
        department: student.department
        // Note: isNEP is determined by program, not stored per student
      }));
      await insertMany('students', dbData);
    }
    
    // Also save to file as backup
    await fs.writeFile(studentsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving students:', error);
    // Fallback to file only
    await fs.writeFile(studentsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}


export async function GET(req: NextRequest) {
  try {
    const data = await getStudents();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch students data' }, { status: 500 });
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
    
  // Load courses.json for code-to-name mapping
  const coursesPath = path.join(process.cwd(), 'src', 'lib', 'courses.json');
  let courses = [];
  try {
    const coursesRaw = await fs.readFile(coursesPath, 'utf-8');
    courses = JSON.parse(coursesRaw);
  } catch (e) {
    console.error('Could not load courses.json for elective mapping', e);
  }
  const codeToName = Object.fromEntries(courses.map((c: any) => [c.id, c.name]));

  const validatedData = data.map(item => {
    // Handle electives as array of strings (as expected by StudentSchema)
    const electiveCodes = Array.isArray(item.electives)
      ? item.electives.map((e: string) => e.trim())
      : String(item.electives || '').split(',').map((e: string) => e.trim()).filter(Boolean);

    // Universal type fixer for all student fields
    function fixTypes(row: Record<string, any>) {
      const fixed: Record<string, any> = {};
      const numberFields = ['credits', 'currentSemester'];
      
      for (const key in row) {
        let val = row[key];
        if (typeof val === 'string') {
          val = val.trim();
          if (val === '') {
            val = undefined;
          } else if (!isNaN(Number(val)) && /^\d+(\.\d+)?$/.test(val)) {
            val = Number(val);
          }
        }
        // For number fields, always coerce to number
        if (numberFields.includes(key) && val !== undefined && val !== '') {
          val = Number(val);
        }
        if (val !== undefined) fixed[key] = val;
      }
      return fixed;
    }

    const fixedItem = fixTypes({
      ...item,
      electives: electiveCodes, // Keep as array of strings for schema validation
      credits: Number(item.credits) || 0,
      currentSemester: Number(item.currentSemester) || 1,
      department: item.department || 'CSE',
      programId: item.programId || 'BTCSE',
      sectionId: item.sectionId || 'SEC001',
      enrolledCourses: []
    });

    const parsed = StudentSchema.safeParse(fixedItem);

    if (!parsed.success) {
      console.error("CSV validation error for item:", item, parsed.error.flatten());
      return null;
    }
    return parsed.data;
  }).filter(Boolean);

    if (validatedData.length === 0 && data.length > 0) {
        return NextResponse.json({ error: 'No valid data to import. Please check CSV format.' }, { status: 400 });
    }

    await saveStudents(validatedData);

    return NextResponse.json({ success: true, importedCount: validatedData.length });
  } catch (error) {
    console.error("Error updating students:", error);
    return NextResponse.json({ error: 'Failed to update students data' }, { status: 500 });
  }
}

// PUT /api/data/students - Update a single student
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Validate the student data
    const validatedData = StudentSchema.safeParse(body);
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
      student_id: validatedData.data.studentId,
      program_id: validatedData.data.programId,
      current_semester: validatedData.data.currentSemester,
      section_id: validatedData.data.sectionId,
      electives: validatedData.data.electives,
      department: validatedData.data.department
    };

    // Update the student
    const updatedStudent = await update('students', studentId, dbData);
    
    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Transform back to frontend format
    const responseData = transformStudentsFromDB([updatedStudent])[0];

    return NextResponse.json({ message: 'Student updated successfully', student: responseData });
  } catch (error) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

// DELETE /api/data/students - Delete a student
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Delete the student from database
    const deleted = await deleteOne('students', studentId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Failed to delete student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getAll, insertMany, collections } from '@/server/neon';
import { StudentSchema } from '@/lib/data-schemas';

const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');

async function getStudents() {
  try {
    // First try to get from Neon database
    const data = await getAll('students');

    if (!data || data.length === 0) {
      // Fallback to file if no data in database
      console.log('No students found in database, falling back to file');
      try {
        const fileData = await fs.readFile(studentsFilePath, 'utf-8');
        return JSON.parse(fileData);
      } catch (e) {
        // If file missing, return empty array
        return [];
      }
    }

    return data;
  } catch (error) {
    console.log('Database error, falling back to file:', error);
    try {
      const fileData = await fs.readFile(studentsFilePath, 'utf-8');
      return JSON.parse(fileData);
    } catch (fileError) {
      console.error('Both database and file failed:', fileError);
      return [];
    }
  }
}

async function saveStudents(data: any[]) {
  try {
    // Save to Neon database
    const result = await insertMany('students', data);
    
    // Also save to file as backup
    await fs.writeFile(studentsFilePath, JSON.stringify(data, null, 2));
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving students:', error);
    
    // Fallback to file save only
    try {
      await fs.writeFile(studentsFilePath, JSON.stringify(data, null, 2));
      return { success: true, warning: 'Saved to file only, database failed' };
    } catch (fileError) {
      console.error('File save also failed:', fileError);
      throw error;
    }
  }
}

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const students = await request.json();
    
    if (!Array.isArray(students)) {
      return NextResponse.json(
        { error: 'Expected an array of students' },
        { status: 400 }
      );
    }

    // Validate each student
    for (const student of students) {
      try {
        StudentSchema.parse(student);
      } catch (validationError: any) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors,
            invalidStudent: student
          },
          { status: 400 }
        );
      }
    }

    const result = await saveStudents(students);
    
    return NextResponse.json({
      message: 'Students saved successfully',
      count: students.length,
      result
    });
  } catch (error: any) {
    console.error('Error saving students:', error);
    return NextResponse.json(
      { error: 'Failed to save students', details: error.message },
      { status: 500 }
    );
  }
}
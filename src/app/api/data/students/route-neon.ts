import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/server/neon';
import { StudentSchema } from '@/lib/data-schemas';

const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');

async function getStudents() {
  try {
    // First try to get from Neon database
    const data = await query('SELECT * FROM students ORDER BY custom_id');
    
    if (data && data.length > 0) {
      return data;
    }

    // Fallback to file if no data in database
    console.log('No students found in database, falling back to file');
    const fileData = await fs.readFile(studentsFilePath, 'utf-8');
    return JSON.parse(fileData);
  } catch (error: any) {
    console.log('Database error, falling back to file:', error.message);
    // Fallback to file if database fails
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
    // Ensure students table exists
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        student_id VARCHAR(255) UNIQUE,
        program_id VARCHAR(255),
        current_semester INTEGER,
        electives JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clear existing data
    await query('DELETE FROM students');

    // Insert new data if any
    if (data.length > 0) {
      const insertPromises = data.map((student: any) => {
        return query(
          'INSERT INTO students (custom_id, name, student_id, program_id, current_semester, electives) VALUES ($1, $2, $3, $4, $5, $6)',
          [
            student.custom_id,
            student.name,
            student.student_id,
            student.program_id,
            student.current_semester,
            JSON.stringify(student.electives || [])
          ]
        );
      });

      await Promise.all(insertPromises);
    }

    // Also save to file as backup
    await fs.writeFile(studentsFilePath, JSON.stringify(data, null, 2));
    
    return { success: true };
  } catch (error: any) {
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
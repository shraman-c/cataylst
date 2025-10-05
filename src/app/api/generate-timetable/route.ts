
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { GenerateTimetableInputSchema } from '@/lib/types';
import { runGeneticAlgorithm } from '@/lib/genetic-algorithm';

import { insertMany, collections } from '@/server/neon';


export const maxDuration = 120; // Extend timeout to 2 minutes for GA

const timetableFilePath = path.join(process.cwd(), 'src', 'lib', 'timetable.json');

// Helper function to convert day name to number
function getDayNumber(day: string): number {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const index = days.findIndex(d => d.toLowerCase() === day.toLowerCase());
  return index !== -1 ? index : 1; // Default to Monday if not found
}

async function saveTimetable(data: any) {
  try {
    // Transform data for proper database format
    const dbData = data.map((entry: any, index: number) => ({
      custom_id: entry._id || entry.id || `TT${Date.now()}_${index}`,
      section_id: entry.sectionId || entry.section_id,
      course_id: entry.courseId || entry.course_id,
      teacher_id: entry.teacherId || entry.teacher_id,
      room_id: entry.roomId || entry.room_id,
      day_of_week: typeof entry.day === 'string' ? getDayNumber(entry.day) : (entry.day_of_week || 1),
      start_time: entry.timeStart || entry.start_time,
      end_time: entry.timeEnd || entry.end_time,
      semester: entry.semester || 1,
      academic_year: entry.academic_year || '2024-25',
      is_active: entry.is_active !== false
    }));
    
    // Save to Neon database
    if (dbData.length > 0) {
      await insertMany('timetables', dbData);
    }
    
    // Also save to file as backup
    await fs.writeFile(timetableFilePath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✅ Generated and saved ${dbData.length} timetable entries to database`);
  } catch (error) {
    console.error('Error saving timetable:', error);
    // Fallback to file only
    await fs.writeFile(timetableFilePath, JSON.stringify(data, null, 2), 'utf-8');
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
    
    const parsedData = GenerateTimetableInputSchema.safeParse(body);
    if (!parsedData.success) {
      console.error('Validation failed:', parsedData.error.issues);
      console.error('Input data keys:', Object.keys(body));
      console.error('Students sample:', body.students?.[0]);
      console.error('Teachers sample:', body.teachers?.[0]);
      console.error('Courses sample:', body.courses?.[0]);
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: parsedData.error.flatten(),
        issues: parsedData.error.issues 
      }, { status: 400 });
    }
    
    const { students, teachers, courses, rooms, programs, generationMode, targetSemester, targetProgramId, targetSection } = parsedData.data;

    // Create semester generation config
    const config = {
      generationMode,
      targetSemester,
      targetProgramId,
      targetSection,
      programs
    };

    const result = runGeneticAlgorithm(students, teachers, courses, rooms, config);

    // Prepare data for local JSON storage
    const timetableToInsert = result.bestTimetable.map((slot, index) => {
        const { id, ...rest } = slot;
        return {
            ...rest,
            // Use a consistent, predictable ID for local file usage
            _id: `${slot.courseId}-${slot.day}-${slot.timeStart}-${index}`
        };
    });

    await saveTimetable(timetableToInsert);
    
    // The client expects an 'id' field that matches '_id'
    const finalTimetableForClient = timetableToInsert.map(slot => ({
        ...slot,
        id: slot._id,
    }));


    return NextResponse.json({
      timetable: finalTimetableForClient,
      bestScore: result.bestScore,
      generations: result.generations,
    });

  } catch (error: any) {
    console.error("Timetable Generation API Error:", error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

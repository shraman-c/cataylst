
import { NextRequest, NextResponse } from 'next/server';
import { getAll, insertMany, query } from '@/server/neon';
import { z } from 'zod';

// Timetable schema for validation
const TimetableEntrySchema = z.object({
  id: z.string().optional(),
  custom_id: z.string().optional(),
  section_id: z.string(),
  course_id: z.string(),
  teacher_id: z.string(),
  room_id: z.string(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  semester: z.number().min(1).max(10),
  academic_year: z.string().default('2024-25'),
  is_active: z.boolean().default(true)
});

// Function to save timetable to database only
async function saveTimetableToDatabase(timetableData: any[]) {
  try {
    // First clear existing timetable data
    await query('DELETE FROM timetables');
    
    // Transform data for database format if needed
    const dbData = timetableData.map((entry, index) => ({
      custom_id: entry.custom_id || entry.id || `TT${Date.now()}_${index}`,
      section_id: entry.section_id || entry.sectionId,
      course_id: entry.course_id || entry.courseId,
      teacher_id: entry.teacher_id || entry.teacherId,
      room_id: entry.room_id || entry.roomId,
      day_of_week: typeof entry.day_of_week === 'number' ? entry.day_of_week : getDayNumber(entry.day),
      start_time: entry.start_time || entry.timeStart,
      end_time: entry.end_time || entry.timeEnd,
      semester: entry.semester || 1,
      academic_year: entry.academic_year || '2024-25',
      is_active: entry.is_active !== false
    }));
    
    // Insert new timetable data
    if (dbData.length > 0) {
      await insertMany('timetables', dbData);
    }
    
    console.log(`✅ Saved ${dbData.length} timetable entries to database`);
  } catch (error) {
    console.error('Error saving timetable to database:', error);
    throw error;
  }
}

// Helper function to convert day name to number
function getDayNumber(day: string): number {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const index = days.findIndex(d => d.toLowerCase() === day.toLowerCase());
  return index !== -1 ? index : 1; // Default to Monday if not found
}

async function getTimetable() {
  try {
    // Get from Neon database only
    const data = await getAll('timetables');
    return data || [];
  } catch (error) {
    console.error('Error getting timetable from database:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const timetable = await getTimetable();
    return NextResponse.json(timetable);
  } catch (error) {
    console.error("Failed to fetch timetable data:", error);
    return NextResponse.json({ error: 'Failed to fetch timetable data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
      // Handle CSV upload
      const csvData = await req.text();
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV must have header and at least one data row' }, { status: 400 });
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const timetableData = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const item: any = {};
        
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        
        // Convert and validate data
        const timetableEntry = {
          custom_id: item.id || item.custom_id || `TT${Date.now()}_${i}`,
          section_id: item.sectionId || item.section_id,
          course_id: item.courseId || item.course_id,
          teacher_id: item.teacherId || item.teacher_id,
          room_id: item.roomId || item.room_id,
          day_of_week: typeof item.day_of_week === 'string' ? getDayNumber(item.day_of_week) : Number(item.day_of_week) || 1,
          start_time: item.start_time || item.timeStart,
          end_time: item.end_time || item.timeEnd,
          semester: Number(item.semester) || 1,
          academic_year: item.academic_year || '2024-25',
          is_active: item.is_active !== 'false'
        };
        
        const parsed = TimetableEntrySchema.safeParse(timetableEntry);
        
        if (parsed.success) {
          timetableData.push(parsed.data);
        } else {
          errors.push(`Row ${i}: ${parsed.error.message}`);
        }
      }
      
      if (errors.length > 0) {
        return NextResponse.json({ 
          error: 'Validation errors occurred',
          details: errors 
        }, { status: 400 });
      }
      
      // Save to database
      await saveTimetableToDatabase(timetableData);
      
      return NextResponse.json({ 
        message: `Successfully uploaded ${timetableData.length} timetable entries`,
        count: timetableData.length 
      });
    } else {
      // Handle JSON upload
      const body = await req.json();
      
      if (Array.isArray(body)) {
        // Multiple timetable entries - replace entire timetable
        await saveTimetableToDatabase(body);
        
        return NextResponse.json({ 
          message: `Successfully updated timetable with ${body.length} entries`,
          count: body.length 
        });
      } else {
        // Single timetable entry - add to existing
        const currentTimetable = await getTimetable();
        currentTimetable.push(body);
        
        await saveTimetableToDatabase(currentTimetable);
        
        return NextResponse.json({ 
          message: 'Successfully added timetable entry',
          data: body 
        });
      }
    }
  } catch (error) {
    console.error('Failed to upload timetable:', error);
    return NextResponse.json({ error: 'Failed to upload timetable' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Replace entire timetable
    await saveTimetableToDatabase(body);
    
    return NextResponse.json({ 
      message: `Successfully updated entire timetable with ${body.length} entries`,
      count: body.length 
    });
  } catch (error) {
    console.error('Failed to update timetable:', error);
    return NextResponse.json({ error: 'Failed to update timetable' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('id');
    
    if (entryId) {
      // Delete specific entry
      await query(`DELETE FROM timetables WHERE custom_id = '${entryId}'`);
      
      return NextResponse.json({ message: 'Timetable entry deleted successfully' });
    } else {
      // Clear entire timetable
      await query('DELETE FROM timetables');
      
      return NextResponse.json({ message: 'Entire timetable cleared successfully' });
    }
  } catch (error) {
    console.error('Failed to delete timetable:', error);
    return NextResponse.json({ error: 'Failed to delete timetable' }, { status: 500 });
  }
}

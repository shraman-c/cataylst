
import { NextRequest, NextResponse } from 'next/server';
import { getAll, insertMany, query } from '@/server/neon';
import { TimetableSlotSchema } from '@/lib/data-schemas';

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

// Function to save timetable to database only
async function saveTimetableToDatabase(timetableData: any[]) {
  try {
    // First clear existing timetable data
    await query('DELETE FROM timetables');
    
    // Transform data for database format if needed
    const dbData = timetableData.map((entry, index) => ({
      custom_id: entry.custom_id || entry.id || entry._id || `TT${Date.now()}_${index}`,
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


export async function PUT(req: NextRequest) {
  try {
    // Enhanced JSON parsing with better error handling
    let body;
    let rawBody = '';
    
    try {
        // First get the raw text to debug
        rawBody = await req.text();
        console.log('Raw request body:', rawBody);
        
        // Then parse as JSON
        body = JSON.parse(rawBody);
        console.log('Parsed body:', body);
    } catch (e: any) {
        console.error('JSON parsing error:', e.message);
        console.error('Raw body that failed to parse:', rawBody);
        return NextResponse.json({ 
          error: 'Invalid JSON in request body', 
          details: e.message,
          receivedData: rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : '')
        }, { status: 400 });
    }

    // Validate body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ 
        error: 'Request body must be a valid JSON object', 
        receivedType: typeof body 
      }, { status: 400 });
    }
    
    const { originalId, ...slotData } = body;

    if (!originalId) {
       return NextResponse.json({ error: 'originalId is required for updating.' }, { status: 400 });
    }

    // Create a more flexible validation schema for updates
    // We don't need all fields to be present for updates
    console.log('Slot data to validate:', slotData);
    
    const currentTimetable = await getTimetable();
    console.log('Current timetable length:', currentTimetable.length);
    
    // Look for the slot with various possible ID fields
    let slotIndex = currentTimetable.findIndex((s: any) => 
      s._id === originalId || s.id === originalId || s.custom_id === originalId
    );
    
    console.log('Found slot index:', slotIndex);
    
    if (slotIndex === -1) {
        console.log('Available slot IDs:', currentTimetable.map((s: any) => ({ _id: s._id, id: s.id, custom_id: s.custom_id })));
        return NextResponse.json({ 
          error: 'Timetable slot not found', 
          searchedFor: originalId,
          availableIds: currentTimetable.map((s: any) => s._id || s.id || s.custom_id).filter(Boolean).slice(0, 10)
        }, { status: 404 });
    }
    
    // We keep the original _id but update the content
    const updatedSlot = { ...currentTimetable[slotIndex], ...slotData };
    currentTimetable[slotIndex] = updatedSlot;
    
    console.log('Updated slot:', updatedSlot);
    
    // Save to both database and file
    await saveTimetableToDatabase(currentTimetable);

    return NextResponse.json({ 
      success: true, 
      updatedSlot: updatedSlot 
    });

  } catch (error: any) {
    console.error("Failed to update timetable slot:", error);
    return NextResponse.json({ 
      error: 'Failed to update timetable slot', 
      details: error.message 
    }, { status: 500 });
  }
}

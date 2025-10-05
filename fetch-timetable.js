/**
 * Fetch Master Timetable from Supabase
 * 
 * This script retrieves and displays the complete timetable from Supabase
 * with detailed information including course names, teacher names, and room details
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required. Set it in your local .env or CI secrets.');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Set it in your local .env or CI secrets.');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fetchMasterTimetable() {
  console.log('📅 Fetching Master Timetable from Supabase...\n');
  
  try {
    // Fetch all timetable data
    const { data: timetableData, error: timetableError } = await supabase
      .from('timetables')
      .select('*')
      .order('day', { ascending: true })
      .order('time_start', { ascending: true });
    
    if (timetableError) {
      throw new Error(`Error fetching timetable: ${timetableError.message}`);
    }
    
    // Fetch related data for enrichment
    const [coursesResult, teachersResult, roomsResult] = await Promise.all([
      supabase.from('courses').select('custom_id, name'),
      supabase.from('teachers').select('custom_id, name'),
      supabase.from('rooms').select('custom_id, name, capacity, is_lab')
    ]);
    
    if (coursesResult.error || teachersResult.error || roomsResult.error) {
      console.warn('⚠️ Warning: Could not fetch all related data. Using IDs only.');
    }
    
    // Create lookup maps
    const coursesMap = new Map();
    const teachersMap = new Map();
    const roomsMap = new Map();
    
    if (coursesResult.data) {
      coursesResult.data.forEach(course => coursesMap.set(course.custom_id, course));
    }
    if (teachersResult.data) {
      teachersResult.data.forEach(teacher => teachersMap.set(teacher.custom_id, teacher));
    }
    if (roomsResult.data) {
      roomsResult.data.forEach(room => roomsMap.set(room.custom_id, room));
    }
    
    // Enrich timetable data
    const enrichedTimetable = timetableData.map(slot => {
      const course = coursesMap.get(slot.course_id);
      const teacher = teachersMap.get(slot.teacher_id);
      const room = roomsMap.get(slot.room_id);
      
      return {
        id: slot.custom_id,
        day: slot.day,
        timeStart: slot.time_start,
        timeEnd: slot.time_end,
        course: {
          id: slot.course_id,
          name: course?.name || 'Unknown Course'
        },
        teacher: {
          id: slot.teacher_id,
          name: teacher?.name || 'Unknown Teacher'
        },
        room: {
          id: slot.room_id,
          name: room?.name || 'Unknown Room',
          capacity: room?.capacity || 'N/A',
          isLab: room?.is_lab || false
        }
      };
    });
    
    // Group by day for better display
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timetableByDay = {};
    
    dayOrder.forEach(day => {
      timetableByDay[day] = enrichedTimetable.filter(slot => slot.day === day);
    });
    
    // Display the timetable
    console.log('📊 MASTER TIMETABLE FROM SUPABASE');
    console.log('=================================\n');
    
    let totalSlots = 0;
    
    dayOrder.forEach(day => {
      const daySlots = timetableByDay[day];
      console.log(`📅 ${day.toUpperCase()}`);
      console.log('─'.repeat(day.length + 4));
      
      if (daySlots.length === 0) {
        console.log('   No classes scheduled\n');
        return;
      }
      
      daySlots.forEach(slot => {
        console.log(`   🕒 ${slot.timeStart} - ${slot.timeEnd}`);
        console.log(`      📚 Course: ${slot.course.name} (${slot.course.id})`);
        console.log(`      👨‍🏫 Teacher: ${slot.teacher.name} (${slot.teacher.id})`);
        console.log(`      🏛️  Room: ${slot.room.name} (${slot.room.id}) - Capacity: ${slot.room.capacity}${slot.room.isLab ? ' [LAB]' : ''}`);
        console.log('');
      });
      
      totalSlots += daySlots.length;
      console.log(`   Total slots for ${day}: ${daySlots.length}\n`);
    });
    
    // Summary statistics
    console.log('📈 TIMETABLE STATISTICS');
    console.log('=====================');
    console.log(`📊 Total scheduled slots: ${totalSlots}`);
    console.log(`📅 Days with classes: ${dayOrder.filter(day => timetableByDay[day].length > 0).length}/5`);
    
    // Count unique courses, teachers, and rooms
    const uniqueCourses = new Set(enrichedTimetable.map(slot => slot.course.id)).size;
    const uniqueTeachers = new Set(enrichedTimetable.map(slot => slot.teacher.id)).size;
    const uniqueRooms = new Set(enrichedTimetable.map(slot => slot.room.id)).size;
    
    console.log(`📚 Unique courses scheduled: ${uniqueCourses}`);
    console.log(`👨‍🏫 Unique teachers assigned: ${uniqueTeachers}`);
    console.log(`🏛️  Unique rooms used: ${uniqueRooms}`);
    
    // Time slot analysis
    const timeSlots = new Set(enrichedTimetable.map(slot => `${slot.timeStart}-${slot.timeEnd}`));
    console.log(`🕒 Different time slots: ${timeSlots.size}`);
    
    console.log('\n✅ Master timetable fetched successfully from Supabase!');
    
    return enrichedTimetable;
    
  } catch (error) {
    console.error('❌ Error fetching master timetable:', error.message);
    throw error;
  }
}

// Function to save timetable to JSON (optional)
async function saveTimetableToFile(timetable) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const filename = `master-timetable-${new Date().toISOString().split('T')[0]}.json`;
  const filepath = path.join(__dirname, filename);
  
  await fs.writeFile(filepath, JSON.stringify(timetable, null, 2));
  console.log(`💾 Timetable saved to: ${filename}`);
}

// Run if executed directly
if (require.main === module) {
  fetchMasterTimetable()
    .then(timetable => {
      console.log('\n💾 Would you like to save this timetable to a JSON file? (Uncomment the line below)');
      console.log('// saveTimetableToFile(timetable);');
    })
    .catch(error => {
      console.error('Failed to fetch timetable:', error);
      process.exit(1);
    });
}

module.exports = { fetchMasterTimetable, saveTimetableToFile };
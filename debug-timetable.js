/**
 * Debug Timetable Data in Supabase
 * Check what's actually stored in the timetables table
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

async function debugTimetableData() {
  console.log('🔍 Debugging timetable data in Supabase...\n');
  
  try {
    // Check timetables table
    const { data: timetableData, error: timetableError, count } = await supabase
      .from('timetables')
      .select('*', { count: 'exact' });
    
    if (timetableError) {
      console.error('❌ Error fetching timetables:', timetableError);
      return;
    }
    
    console.log(`📊 Total records in timetables table: ${count}`);
    
    if (count === 0) {
      console.log('⚠️ No records found in timetables table!');
      console.log('Let me check if there are any records with different criteria...\n');
      
      // Try to get any records without filters
      const { data: anyData, error: anyError } = await supabase
        .from('timetables')
        .select('*')
        .limit(5);
      
      if (anyError) {
        console.error('❌ Error fetching any timetable data:', anyError);
        return;
      }
      
      console.log(`Found ${anyData?.length || 0} records without filters`);
      
    } else {
      console.log('\n📋 Sample timetable records:');
      console.log('===============================');
      
      // Show first few records
      const sampleData = timetableData.slice(0, 5);
      sampleData.forEach((record, index) => {
        console.log(`\n${index + 1}. Record ID: ${record.id}`);
        console.log(`   Custom ID: ${record.custom_id}`);
        console.log(`   Day: ${record.day}`);
        console.log(`   Time: ${record.time_start} - ${record.time_end}`);
        console.log(`   Course ID: ${record.course_id}`);
        console.log(`   Teacher ID: ${record.teacher_id}`);
        console.log(`   Room ID: ${record.room_id}`);
        console.log(`   Created: ${record.created_at}`);
      });
      
      if (timetableData.length > 5) {
        console.log(`\n... and ${timetableData.length - 5} more records`);
      }
      
      // Group by day to see distribution
      const dayDistribution = {};
      timetableData.forEach(record => {
        if (!dayDistribution[record.day]) {
          dayDistribution[record.day] = 0;
        }
        dayDistribution[record.day]++;
      });
      
      console.log('\n📅 Records by day:');
      Object.entries(dayDistribution).forEach(([day, count]) => {
        console.log(`   ${day}: ${count} records`);
      });
    }
    
    // Also check related tables
    console.log('\n🔍 Checking related tables...');
    
    const [coursesResult, teachersResult, roomsResult] = await Promise.all([
      supabase.from('courses').select('custom_id, name', { count: 'exact' }),
      supabase.from('teachers').select('custom_id, name', { count: 'exact' }),
      supabase.from('rooms').select('custom_id, name', { count: 'exact' })
    ]);
    
    console.log(`📚 Courses: ${coursesResult.count} records`);
    console.log(`👨‍🏫 Teachers: ${teachersResult.count} records`);
    console.log(`🏛️ Rooms: ${roomsResult.count} records`);
    
    if (coursesResult.data?.length > 0) {
      console.log(`   Sample course: ${coursesResult.data[0].name} (${coursesResult.data[0].custom_id})`);
    }
    if (teachersResult.data?.length > 0) {
      console.log(`   Sample teacher: ${teachersResult.data[0].name} (${teachersResult.data[0].custom_id})`);
    }
    if (roomsResult.data?.length > 0) {
      console.log(`   Sample room: ${roomsResult.data[0].name} (${roomsResult.data[0].custom_id})`);
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugTimetableData();
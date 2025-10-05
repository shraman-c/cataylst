/**
 * Fix Timetable Migration - Handle records with _id instead of id
 */

const fs = require('fs').promises;
const path = require('path');
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

async function fixTimetableMigration() {
  console.log('🔧 Fixing timetable migration...');
  
  try {
    // Read timetable data
    const timetableFile = path.join(__dirname, 'src', 'lib', 'timetable.json');
    const data = await fs.readFile(timetableFile, 'utf-8');
    const timetableData = JSON.parse(data);
    
    console.log(`📊 Found ${timetableData.length} timetable records`);
    
    // Transform data - handle both 'id' and '_id' fields
    const transformedData = timetableData.map((slot, index) => ({
      custom_id: slot.id || slot._id || `slot-${index}-${Date.now()}`, // Use id, _id, or generate one
      day: slot.day,
      time_start: slot.timeStart,
      time_end: slot.timeEnd,
      course_id: slot.courseId,
      teacher_id: slot.teacherId,
      room_id: slot.roomId,
    })).filter(slot => slot.custom_id); // Filter out any null/undefined custom_ids
    
    console.log(`🔄 Transformed ${transformedData.length} valid records`);
    
    // Clear existing timetable data
    const { error: deleteError } = await supabase
      .from('timetables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('❌ Error clearing timetables:', deleteError);
      return;
    }
    
    // Insert data in batches to avoid timeout
    const batchSize = 20;
    let totalInserted = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('timetables')
        .insert(batch)
        .select();
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
        console.log('Problematic batch:', batch);
        continue;
      }
      
      totalInserted += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
    }
    
    console.log(`\n🎉 Successfully migrated ${totalInserted} timetable records!`);
    
  } catch (error) {
    console.error('❌ Error fixing timetable migration:', error);
  }
}

// Run the fix
fixTimetableMigration();
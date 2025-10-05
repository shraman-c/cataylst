/**
 * Re-migrate Timetable Data to Supabase
 * This script specifically handles the timetable migration with better error handling
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

async function reMigrateTimetable() {
  console.log('🔄 Re-migrating timetable data to Supabase...\n');
  
  try {
    // Read the timetable JSON file
    const timetableFile = path.join(__dirname, 'src', 'lib', 'timetable.json');
    const rawData = await fs.readFile(timetableFile, 'utf-8');
    const timetableData = JSON.parse(rawData);
    
    console.log(`📊 Found ${timetableData.length} timetable records in JSON file`);
    
    if (timetableData.length === 0) {
      console.log('⚠️ No timetable data found in JSON file');
      return;
    }
    
    // Show sample of original data
    console.log('\n📋 Sample original data:');
    console.log(JSON.stringify(timetableData[0], null, 2));
    
    // Transform the data for Supabase
    const transformedData = timetableData.map((slot, index) => {
      // Use _id field since that's what exists in the JSON
      const customId = slot._id || slot.id || `generated-${index}-${Date.now()}`;
      
      const transformed = {
        custom_id: customId,
        day: slot.day,
        time_start: slot.timeStart,
        time_end: slot.timeEnd,
        course_id: slot.courseId,
        teacher_id: slot.teacherId,
        room_id: slot.roomId,
      };
      
      // Validate required fields
      if (!transformed.day || !transformed.time_start || !transformed.time_end || 
          !transformed.course_id || !transformed.teacher_id || !transformed.room_id) {
        console.warn(`⚠️ Warning: Incomplete data for record ${index}:`, slot);
        return null;
      }
      
      return transformed;
    }).filter(slot => slot !== null); // Remove invalid records
    
    console.log(`✅ Transformed ${transformedData.length} valid records`);
    
    if (transformedData.length === 0) {
      console.log('❌ No valid records to migrate');
      return;
    }
    
    // Show sample of transformed data
    console.log('\n📋 Sample transformed data:');
    console.log(JSON.stringify(transformedData[0], null, 2));
    
    // Clear existing data first
    console.log('\n🗑️ Clearing existing timetable data...');
    const { error: deleteError } = await supabase
      .from('timetables')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('❌ Error clearing timetables:', deleteError);
      throw deleteError;
    }
    console.log('✅ Existing data cleared');
    
    // Insert data in smaller batches
    const batchSize = 10;
    let totalInserted = 0;
    let batchNumber = 1;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      
      console.log(`\n📦 Inserting batch ${batchNumber} (${batch.length} records)...`);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('timetables')
        .insert(batch)
        .select();
      
      if (insertError) {
        console.error(`❌ Error inserting batch ${batchNumber}:`, insertError);
        console.log('Problematic batch data:', JSON.stringify(batch, null, 2));
        throw insertError;
      }
      
      totalInserted += batch.length;
      console.log(`✅ Batch ${batchNumber} inserted successfully (${batch.length} records)`);
      batchNumber++;
    }
    
    console.log(`\n🎉 Successfully migrated ${totalInserted} timetable records!`);
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const { data: verifyData, error: verifyError, count } = await supabase
      .from('timetables')
      .select('*', { count: 'exact' });
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
    } else {
      console.log(`✅ Verification successful: ${count} records found in database`);
      
      if (verifyData && verifyData.length > 0) {
        console.log('\n📋 Sample migrated record:');
        const sample = verifyData[0];
        console.log(`   Day: ${sample.day}`);
        console.log(`   Time: ${sample.time_start} - ${sample.time_end}`);
        console.log(`   Course: ${sample.course_id}`);
        console.log(`   Teacher: ${sample.teacher_id}`);
        console.log(`   Room: ${sample.room_id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
reMigrateTimetable()
  .then(() => {
    console.log('\n✅ Timetable migration completed successfully!');
    console.log('🚀 You can now fetch the master timetable from Supabase');
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
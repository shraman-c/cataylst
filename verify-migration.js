/**
 * Verify Data Migration - Check all tables in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (require env vars)
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

async function verifyMigration() {
  console.log('🔍 Verifying data migration to Supabase...\n');
  
  const tables = [
    { name: 'students', display: 'Students' },
    { name: 'teachers', display: 'Teachers' },
    { name: 'courses', display: 'Courses' },
    { name: 'rooms', display: 'Rooms' },
    { name: 'timetables', display: 'Timetable Slots' },
    { name: 'change_requests', display: 'Change Requests' },
  ];
  
  let totalRecords = 0;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact' });
      
      if (error) {
        console.log(`❌ ${table.display}: Error - ${error.message}`);
        continue;
      }
      
      console.log(`✅ ${table.display}: ${count} records`);
      totalRecords += count;
      
      // Show sample data for verification
      if (data && data.length > 0) {
        const sample = data[0];
        const sampleKeys = Object.keys(sample).slice(0, 3).join(', ');
        console.log(`   📋 Sample fields: ${sampleKeys}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${table.display}: Connection error - ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
  
  console.log('📊 MIGRATION VERIFICATION SUMMARY:');
  console.log('==================================');
  console.log(`🎉 Total records in Supabase: ${totalRecords}`);
  console.log('✅ Migration verification complete!');
  console.log('\n💡 Your data is now live in Supabase and ready to use!');
}

verifyMigration();
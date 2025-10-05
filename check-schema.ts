import { query } from './src/server/neon';

async function checkSchema() {
  try {
    const tables = ['students', 'teachers', 'courses', 'rooms', 'timetables'];
    
    for (const table of tables) {
      console.log(`📋 Checking ${table} table schema...`);
      const schema = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        ORDER BY ordinal_position
      `);
      
      console.log(`${table} table columns:`);
      schema.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
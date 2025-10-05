import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchemas() {
  const tables = ['students', 'teachers', 'courses', 'programs', 'rooms'];
  
  for (const table of tables) {
    console.log(`\n${table.toUpperCase()} table columns:`);
    try {
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = ${table}
        ORDER BY ordinal_position;
      `;
      
      columns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    } catch (error) {
      console.log(`Table ${table} does not exist or error: ${error.message}`);
    }
  }
}

checkSchemas().catch(console.error);
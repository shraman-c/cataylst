import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkTableStructure() {
  const columns = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'courses' 
    ORDER BY ordinal_position;
  `;
  
  console.log('Courses table structure:');
  columns.forEach(col => {
    console.log(`- ${col.column_name}: ${col.data_type}`);
  });
  
  // Also check current courses
  const courses = await sql`SELECT * FROM courses LIMIT 5`;
  console.log('\nExisting courses:');
  courses.forEach(course => {
    console.log(`- ${course.id}: ${course.name}`);
  });
}

checkTableStructure().catch(console.error);
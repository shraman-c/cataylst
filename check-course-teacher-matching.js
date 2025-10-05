import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkMatching() {
  const courses = await sql`SELECT * FROM courses`;
  const teachers = await sql`SELECT * FROM teachers`;
  
  console.log('Course-Teacher matching:');
  courses.forEach(course => {
    const courseId = course.custom_id;
    const matchingTeachers = teachers.filter(teacher => 
      teacher.subjects && teacher.subjects.includes(courseId)
    );
    console.log(`${courseId}: ${matchingTeachers.length} teachers can teach this course`);
    if (matchingTeachers.length > 0) {
      console.log(`  Teachers: ${matchingTeachers.map(t => t.name).join(', ')}`);
    }
    console.log('');
  });
}

checkMatching().catch(console.error);
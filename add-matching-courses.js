// Add courses that match teacher subjects for successful timetable generation
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const coursesToAdd = [
  { custom_id: 'CSE11001', name: 'Computer Science Engineering 1', credits: 3, semester: 1, classes_per_week: 3, is_lab: false, program_id: 'CSE_BTech' },
  { custom_id: 'PHY11201', name: 'Physics 1', credits: 4, semester: 1, classes_per_week: 4, is_lab: false, program_id: 'GEN_BTech' },
  { custom_id: 'CSE101', name: 'Introduction to Computer Science', credits: 3, semester: 1, classes_per_week: 3, is_lab: false, program_id: 'CSE_BTech' },
  { custom_id: 'CSE102', name: 'Programming Fundamentals', credits: 3, semester: 1, classes_per_week: 3, is_lab: true, program_id: 'CSE_BTech' },
  { custom_id: 'CSE103', name: 'Data Structures', credits: 4, semester: 2, classes_per_week: 4, is_lab: false, program_id: 'CSE_BTech' },
  { custom_id: 'CSE104', name: 'Algorithms', credits: 4, semester: 2, classes_per_week: 4, is_lab: false, program_id: 'CSE_BTech' },
  { custom_id: 'MTH151', name: 'Mathematics 1', credits: 4, semester: 1, classes_per_week: 4, is_lab: false, program_id: 'GEN_BTech' },
  { custom_id: 'MTH11501', name: 'Advanced Mathematics', credits: 4, semester: 2, classes_per_week: 4, is_lab: false, program_id: 'GEN_BTech' },
  { custom_id: 'PHY12202', name: 'Physics 2', credits: 4, semester: 2, classes_per_week: 4, is_lab: true, program_id: 'GEN_BTech' },
  { custom_id: 'GEE11001', name: 'General Engineering 1', credits: 3, semester: 1, classes_per_week: 3, is_lab: false, program_id: 'GEN_BTech' },
  { custom_id: 'GEE11012', name: 'Engineering Drawing', credits: 2, semester: 1, classes_per_week: 2, is_lab: true, program_id: 'GEN_BTech' },
  { custom_id: 'MEE11002', name: 'Mechanical Engineering Basics', credits: 3, semester: 1, classes_per_week: 3, is_lab: false, program_id: 'MEE_BTech' }
];

async function addCourses() {
  console.log('Adding courses that match teacher subjects...');
  
  for (const course of coursesToAdd) {
    try {
      console.log(`Adding course: ${course.custom_id} - ${course.name}`);
      await sql`
        INSERT INTO courses (custom_id, name, credits, semester, classes_per_week, is_lab, program_id)
        VALUES (${course.custom_id}, ${course.name}, ${course.credits}, ${course.semester}, ${course.classes_per_week}, ${course.is_lab}, ${course.program_id})
        ON CONFLICT (custom_id) DO NOTHING
      `;
    } catch (error) {
      console.error(`Error adding course ${course.custom_id}:`, error);
    }
  }
  
  // Verify what's in the database now
  const allCourses = await sql`SELECT * FROM courses ORDER BY id`;
  console.log(`\nTotal courses in database: ${allCourses.length}`);
  allCourses.forEach(course => {
    console.log(`- ${course.custom_id}: ${course.name}`);
  });
}

addCourses().catch(console.error);
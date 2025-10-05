import dotenv from 'dotenv';
import { query } from './src/server/neon';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testData() {
  console.log('🧪 Testing database operations...');
  
  try {
    // Insert a test student
    await query(`
      INSERT INTO students (custom_id, name, student_id, program_id, current_semester) 
      VALUES ('test-001', 'Test Student', 'STU001', 'CS', 1)
      ON CONFLICT (custom_id) DO NOTHING
    `);
    console.log('✅ Test student inserted');
    
    // Query students
    const students = await query('SELECT * FROM students LIMIT 5');
    console.log(`📋 Found ${students.length} students in database`);
    
    // Insert a test teacher
    await query(`
      INSERT INTO teachers (custom_id, name, teacher_id, subjects) 
      VALUES ('teach-001', 'Test Teacher', 'TCH001', '["Computer Science", "Mathematics"]'::jsonb)
      ON CONFLICT (custom_id) DO NOTHING
    `);
    console.log('✅ Test teacher inserted');
    
    // Query teachers
    const teachers = await query('SELECT * FROM teachers LIMIT 5');
    console.log(`👩‍🏫 Found ${teachers.length} teachers in database`);
    
    // Insert a test course
    await query(`
      INSERT INTO courses (custom_id, name, credits, semester, program_id) 
      VALUES ('course-001', 'Data Structures', 4, 3, 'CS')
      ON CONFLICT (custom_id) DO NOTHING
    `);
    console.log('✅ Test course inserted');
    
    // Query courses
    const courses = await query('SELECT * FROM courses LIMIT 5');
    console.log(`📚 Found ${courses.length} courses in database`);
    
    console.log('\n🎉 Database is working perfectly!');
    console.log('✅ Your Neon backend is ready for Catalyst!');
    console.log('\n🚀 Next steps:');
    console.log('1. Your database schema is set up');
    console.log('2. Test data has been inserted successfully');
    console.log('3. You can now update your API routes to use Neon');
    console.log('4. Import your existing data from JSON files if needed');
    
  } catch (error) {
    console.error('❌ Error testing data:', error);
  }
}

testData();
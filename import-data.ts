import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { insertMany } from './src/server/neon';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function importExistingData() {
  console.log('📥 Importing existing data from JSON files to Neon...');
  
  try {
    const basePath = path.join(process.cwd(), 'src', 'lib');
    
    // Import students
    try {
      const studentsData = await fs.readFile(path.join(basePath, 'students.json'), 'utf-8');
      const students = JSON.parse(studentsData);
      if (students.length > 0) {
        await insertMany('students', students);
        console.log(`✅ Imported ${students.length} students`);
      }
    } catch (error) {
      console.log('⚠️  No students.json file found or error importing students');
    }
    
    // Import teachers
    try {
      const teachersData = await fs.readFile(path.join(basePath, 'teachers.json'), 'utf-8');
      const teachers = JSON.parse(teachersData);
      if (teachers.length > 0) {
        await insertMany('teachers', teachers);
        console.log(`✅ Imported ${teachers.length} teachers`);
      }
    } catch (error) {
      console.log('⚠️  No teachers.json file found or error importing teachers');
    }
    
    // Import courses
    try {
      const coursesData = await fs.readFile(path.join(basePath, 'courses.json'), 'utf-8');
      const courses = JSON.parse(coursesData);
      if (courses.length > 0) {
        await insertMany('courses', courses);
        console.log(`✅ Imported ${courses.length} courses`);
      }
    } catch (error) {
      console.log('⚠️  No courses.json file found or error importing courses');
    }
    
    // Import rooms
    try {
      const roomsData = await fs.readFile(path.join(basePath, 'rooms.json'), 'utf-8');
      const rooms = JSON.parse(roomsData);
      if (rooms.length > 0) {
        await insertMany('rooms', rooms);
        console.log(`✅ Imported ${rooms.length} rooms`);
      }
    } catch (error) {
      console.log('⚠️  No rooms.json file found or error importing rooms');
    }
    
    // Import timetables
    try {
      const timetablesData = await fs.readFile(path.join(basePath, 'timetable.json'), 'utf-8');
      const timetables = JSON.parse(timetablesData);
      if (timetables.length > 0) {
        await insertMany('timetables', timetables);
        console.log(`✅ Imported ${timetables.length} timetable entries`);
      }
    } catch (error) {
      console.log('⚠️  No timetable.json file found or error importing timetables');
    }
    
    console.log('\n🎉 Data import complete!');
    console.log('Your existing data has been migrated to Neon database.');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
  }
}

importExistingData();
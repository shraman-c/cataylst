#!/usr/bin/env tsx

/**
 * Migrate JSON data to Neon database
 * This script reads data from JSON files and inserts it into Neon
 */

import { insertMany, query } from './src/server/neon';
import fs from 'fs/promises';
import path from 'path';

const JSON_DIR = path.join(process.cwd(), 'src', 'lib');

async function readJsonFile(filename: string) {
  try {
    const filePath = path.join(JSON_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error);
    return [];
  }
}

function transformStudentData(students: any[]) {
  return students.map(student => ({
    custom_id: student.id,
    name: student.name,
    student_id: student.studentId,
    program_id: student.programId,
    current_semester: student.currentSemester || 1,
    electives: student.electives || []
  }));
}

function transformTeacherData(teachers: any[]) {
  return teachers.map(teacher => ({
    custom_id: teacher.id,
    name: teacher.name,
    teacher_id: teacher.teacherId,
    subjects: teacher.subjects || [],
    availability: teacher.availability || {}
  }));
}

function transformCourseData(courses: any[]) {
  return courses.map(course => ({
    custom_id: course.id,
    name: course.name,
    credits: course.credits || 0,
    classes_per_week: course.classesPerWeek || 1,
    is_lab: course.isLab || false,
    semester: course.semester || 1,
    program_id: course.programId
  }));
}

function transformRoomData(rooms: any[]) {
  return rooms.map(room => ({
    custom_id: room.id,
    name: room.name,
    capacity: room.capacity || 0,
    is_lab: room.type === 'lab' || false
  }));
}

function transformTimetableData(timetable: any[]) {
  return timetable.map(slot => ({
    custom_id: slot.id || `${slot.day}-${slot.timeStart}-${slot.courseId}`,
    day: slot.day,
    time_start: slot.timeStart,
    time_end: slot.timeEnd,
    course_id: slot.courseId,
    teacher_id: slot.teacherId,
    room_id: slot.roomId,
    section_id: slot.sectionId || ''
  }));
}

async function migrateData() {
  console.log('🚀 Starting JSON to Neon migration...\n');

  try {
    // Read all JSON files
    console.log('📖 Reading JSON files...');
    const studentsData = await readJsonFile('students.json');
    const teachersData = await readJsonFile('teachers.json');
    const coursesData = await readJsonFile('courses.json');
    const roomsData = await readJsonFile('rooms.json');
    const timetableData = await readJsonFile('timetable.json');

    console.log(`✅ Students: ${studentsData.length} records`);
    console.log(`✅ Teachers: ${teachersData.length} records`);
    console.log(`✅ Courses: ${coursesData.length} records`);
    console.log(`✅ Rooms: ${roomsData.length} records`);
    console.log(`✅ Timetable: ${timetableData.length} records\n`);

    // Transform and insert data into Neon
    console.log('💾 Inserting data into Neon database...\n');

    if (studentsData.length > 0) {
      console.log('👨‍🎓 Migrating students...');
      const transformedStudents = transformStudentData(studentsData);
      await insertMany('students', transformedStudents);
      console.log('✅ Students migrated successfully');
    }

    if (teachersData.length > 0) {
      console.log('👩‍🏫 Migrating teachers...');
      const transformedTeachers = transformTeacherData(teachersData);
      await insertMany('teachers', transformedTeachers);
      console.log('✅ Teachers migrated successfully');
    }

    if (coursesData.length > 0) {
      console.log('📚 Migrating courses...');
      const transformedCourses = transformCourseData(coursesData);
      await insertMany('courses', transformedCourses);
      console.log('✅ Courses migrated successfully');
    }

    if (roomsData.length > 0) {
      console.log('🏫 Migrating rooms...');
      const transformedRooms = transformRoomData(roomsData);
      await insertMany('rooms', transformedRooms);
      console.log('✅ Rooms migrated successfully');
    }

    if (timetableData.length > 0) {
      console.log('📅 Migrating timetable...');
      const transformedTimetable = transformTimetableData(timetableData);
      await insertMany('timetables', transformedTimetable);
      console.log('✅ Timetable migrated successfully');
    }

    console.log('\n🎉 Migration completed successfully!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const studentCount = await query('SELECT COUNT(*) as count FROM students');
    const teacherCount = await query('SELECT COUNT(*) as count FROM teachers');
    const courseCount = await query('SELECT COUNT(*) as count FROM courses');
    const roomCount = await query('SELECT COUNT(*) as count FROM rooms');
    const timetableCount = await query('SELECT COUNT(*) as count FROM timetables');

    console.log(`📊 Database now contains:`);
    console.log(`   - Students: ${studentCount[0].count}`);
    console.log(`   - Teachers: ${teacherCount[0].count}`);
    console.log(`   - Courses: ${courseCount[0].count}`);
    console.log(`   - Rooms: ${roomCount[0].count}`);
    console.log(`   - Timetable slots: ${timetableCount[0].count}`);
    
    console.log('\n✅ Your Neon database is now populated with data!');
    console.log('🌐 Test it at: http://localhost:9002/api/data/students');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateData().catch(console.error);
}

export { migrateData };
import { insertMany } from './src/server/neon';
import fs from 'fs/promises';
import path from 'path';

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

async function migrateTimetable() {
  try {
    console.log('📅 Migrating timetable data...');
    
    const filePath = path.join(process.cwd(), 'src', 'lib', 'timetable.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const timetableData = JSON.parse(data);
    
    console.log(`📋 Found ${timetableData.length} timetable slots`);
    
    const transformedData = transformTimetableData(timetableData);
    console.log('🔄 Transformed data sample:', transformedData[0]);
    
    await insertMany('timetables', transformedData);
    console.log('✅ Timetable migrated successfully!');
    
  } catch (error) {
    console.error('❌ Timetable migration failed:', error);
  }
}

migrateTimetable();
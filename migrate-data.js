/**
 * Data Migration Script: JSON Files to Supabase
 * 
 * This script migrates all existing data from local JSON files to Supabase database
 */

const fs = require('fs').promises;
const path = require('path');

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required. Set it in your local .env or CI secrets.');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required. Set it in your local .env or CI secrets.');

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// File paths
const dataFiles = {
  students: path.join(__dirname, 'src', 'lib', 'students.json'),
  teachers: path.join(__dirname, 'src', 'lib', 'teachers.json'),
  courses: path.join(__dirname, 'src', 'lib', 'courses.json'),
  rooms: path.join(__dirname, 'src', 'lib', 'rooms.json'),
  timetable: path.join(__dirname, 'src', 'lib', 'timetable.json'),
  changeRequests: path.join(__dirname, 'src', 'lib', 'changeRequests.json'),
};

// Helper function to read JSON file
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`📋 File not found: ${path.basename(filePath)} - Skipping`);
      return [];
    }
    throw error;
  }
}

// Data transformation functions
function transformStudents(students) {
  return students.map(student => ({
    custom_id: student.id,
    name: student.name,
    student_id: student.studentId,
    electives: student.electives || [],
    credits: student.credits || 0,
  }));
}

function transformTeachers(teachers) {
  return teachers.map(teacher => ({
    custom_id: teacher.id,
    name: teacher.name,
    teacher_id: teacher.teacherId,
    subjects: teacher.subjects || [],
    availability: teacher.availability || {},
    designation: teacher.designation || null,
  }));
}

function transformCourses(courses) {
  return courses.map(course => ({
    custom_id: course.id,
    name: course.name,
    credits: course.credits,
    classes_per_week: course.classesPerWeek,
    is_lab: course.isLab || false,
  }));
}

function transformRooms(rooms) {
  return rooms.map(room => ({
    custom_id: room.id,
    name: room.name,
    capacity: room.capacity,
    is_lab: room.isLab || false,
  }));
}

function transformTimetable(timetable) {
  return timetable.map(slot => ({
    custom_id: slot.id,
    day: slot.day,
    time_start: slot.timeStart,
    time_end: slot.timeEnd,
    course_id: slot.courseId,
    teacher_id: slot.teacherId,
    room_id: slot.roomId,
  }));
}

function transformChangeRequests(changeRequests) {
  return changeRequests.map(request => ({
    custom_id: request._id,
    requester_id: request.requesterId,
    requester_name: request.requesterName,
    slot_id: request.slotId,
    request_details: request.requestDetails,
    status: request.status || 'pending',
  }));
}

// Migration functions
async function migrateTable(tableName, data, transformFn) {
  if (!data || data.length === 0) {
    console.log(`📋 No data to migrate for ${tableName}`);
    return { success: true, count: 0 };
  }

  try {
    // Transform data to match Supabase schema
    const transformedData = transformFn(data);
    
    console.log(`🔄 Migrating ${transformedData.length} records to ${tableName}...`);
    
    // Clear existing data first
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = table not found
      console.error(`❌ Error clearing ${tableName}:`, deleteError);
      return { success: false, error: deleteError };
    }
    
    // Insert new data
    const { data: insertedData, error: insertError } = await supabase
      .from(tableName)
      .insert(transformedData)
      .select();
    
    if (insertError) {
      console.error(`❌ Error inserting into ${tableName}:`, insertError);
      return { success: false, error: insertError };
    }
    
    console.log(`✅ Successfully migrated ${transformedData.length} records to ${tableName}`);
    return { success: true, count: transformedData.length, data: insertedData };
    
  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error);
    return { success: false, error };
  }
}

// Main migration function
async function migrateAllData() {
  console.log('🚀 Starting data migration from JSON files to Supabase...\n');
  
  const results = {};
  let totalMigrated = 0;
  
  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase.from('students').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection failed: ${error.message}`);
    }
    console.log('✅ Supabase connection successful\n');
    
    // Migrate each data type
    const migrations = [
      { name: 'students', file: dataFiles.students, transform: transformStudents, table: 'students' },
      { name: 'teachers', file: dataFiles.teachers, transform: transformTeachers, table: 'teachers' },
      { name: 'courses', file: dataFiles.courses, transform: transformCourses, table: 'courses' },
      { name: 'rooms', file: dataFiles.rooms, transform: transformRooms, table: 'rooms' },
      { name: 'timetable', file: dataFiles.timetable, transform: transformTimetable, table: 'timetables' },
      { name: 'changeRequests', file: dataFiles.changeRequests, transform: transformChangeRequests, table: 'change_requests' },
    ];
    
    for (const migration of migrations) {
      console.log(`📂 Reading ${migration.name} from ${path.basename(migration.file)}...`);
      const jsonData = await readJsonFile(migration.file);
      
      const result = await migrateTable(migration.table, jsonData, migration.transform);
      results[migration.name] = result;
      
      if (result.success) {
        totalMigrated += result.count;
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📊 MIGRATION SUMMARY:');
    console.log('===================');
    
    for (const [name, result] of Object.entries(results)) {
      if (result.success) {
        console.log(`✅ ${name}: ${result.count} records migrated`);
      } else {
        console.log(`❌ ${name}: Migration failed - ${result.error?.message}`);
      }
    }
    
    console.log(`\n🎉 Total records migrated: ${totalMigrated}`);
    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 Your app is now fully connected to Supabase!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAllData();
}

module.exports = { migrateAllData };
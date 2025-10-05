import dotenv from 'dotenv';
import { query } from './src/server/neon';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

async function setupSchema() {
  console.log('🚀 Setting up Catalyst database schema...');
  
  try {
    // Students table
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        student_id VARCHAR(255) UNIQUE,
        program_id VARCHAR(255),
        current_semester INTEGER,
        electives JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created');
    
    // Teachers table
    await query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        teacher_id VARCHAR(255) UNIQUE,
        subjects JSONB DEFAULT '[]'::jsonb,
        availability JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Teachers table created');
    
    // Courses table
    await query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        credits INTEGER DEFAULT 3,
        classes_per_week INTEGER DEFAULT 3,
        is_lab BOOLEAN DEFAULT false,
        semester INTEGER,
        program_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Courses table created');
    
    // Rooms table
    await query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER DEFAULT 60,
        is_lab BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Rooms table created');
    
    // Timetables table
    await query(`
      CREATE TABLE IF NOT EXISTS timetables (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        day VARCHAR(20) NOT NULL,
        time_start VARCHAR(10) NOT NULL,
        time_end VARCHAR(10) NOT NULL,
        course_id VARCHAR(255),
        teacher_id VARCHAR(255),
        room_id VARCHAR(255),
        section_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Timetables table created');
    
    // Sections table
    await query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        program_id VARCHAR(255) NOT NULL,
        semester INTEGER NOT NULL,
        section_name VARCHAR(10) NOT NULL,
        max_students INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sections table created');
    
    console.log('\n🎉 Database schema setup complete!');
    console.log('📊 Tables created: students, teachers, courses, rooms, timetables, sections');
    console.log('🚀 Your Catalyst database is ready to use!');
    
  } catch (error) {
    console.error('❌ Error setting up schema:', error);
  }
}

setupSchema();
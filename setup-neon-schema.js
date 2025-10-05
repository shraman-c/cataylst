/**
 * Neon Database Schema Setup Script
 * Run this to create all necessary tables for Catalyst
 * 
 * Usage:
 * 1. Make sure your DATABASE_URL is set in .env
 * 2. Run: node setup-neon-schema.js
 */

import { query } from './src/server/neon.js';

const createTables = async () => {
  console.log('🚀 Setting up Catalyst database schema in Neon...');

  try {
    // Programs table
    console.log('📚 Creating programs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        total_semesters INTEGER DEFAULT 8,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Departments table
    console.log('🏢 Creating departments table...');
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        head_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sections table
    console.log('📋 Creating sections table...');
    await query(`
      CREATE TABLE IF NOT EXISTS sections (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        program_id VARCHAR(255) NOT NULL,
        semester INTEGER NOT NULL,
        section_name VARCHAR(10) NOT NULL,
        max_students INTEGER DEFAULT 60,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table
    console.log('👨‍🎓 Creating students table...');
    await query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        student_id VARCHAR(255) UNIQUE,
        program_id VARCHAR(255),
        current_semester INTEGER,
        electives JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Teachers table
    console.log('👩‍🏫 Creating teachers table...');
    await query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        teacher_id VARCHAR(255) UNIQUE,
        subjects JSONB DEFAULT '[]'::jsonb,
        availability JSONB DEFAULT '{}'::jsonb,
        designation VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rooms table
    console.log('🏫 Creating rooms table...');
    await query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        capacity INTEGER DEFAULT 60,
        is_lab BOOLEAN DEFAULT false,
        equipment JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    console.log('📖 Creating courses table...');
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
        is_elective BOOLEAN DEFAULT false,
        nep_course_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Labs table
    console.log('🧪 Creating labs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS labs (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        course_id VARCHAR(255) NOT NULL,
        lab_name VARCHAR(255) NOT NULL,
        equipment_required JSONB DEFAULT '[]'::jsonb,
        max_students INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Timetables table
    console.log('📅 Creating timetables table...');
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Users table (for authentication)
    console.log('👤 Creating users table...');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user',
        profile_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Change requests table
    console.log('🔄 Creating change_requests table...');
    await query(`
      CREATE TABLE IF NOT EXISTS change_requests (
        id SERIAL PRIMARY KEY,
        custom_id VARCHAR(255) UNIQUE NOT NULL,
        requester_id VARCHAR(255) NOT NULL,
        slot_id VARCHAR(255),
        request_details JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    console.log('🔔 Creating notifications table...');
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        read_status BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    console.log('⚡ Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_students_program_id ON students(program_id)',
      'CREATE INDEX IF NOT EXISTS idx_students_custom_id ON students(custom_id)',
      'CREATE INDEX IF NOT EXISTS idx_teachers_custom_id ON teachers(custom_id)',
      'CREATE INDEX IF NOT EXISTS idx_courses_program_id ON courses(program_id)',
      'CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester)',
      'CREATE INDEX IF NOT EXISTS idx_timetables_day ON timetables(day)',
      'CREATE INDEX IF NOT EXISTS idx_timetables_course_id ON timetables(course_id)',
      'CREATE INDEX IF NOT EXISTS idx_timetables_teacher_id ON timetables(teacher_id)',
      'CREATE INDEX IF NOT EXISTS idx_timetables_room_id ON timetables(room_id)',
      'CREATE INDEX IF NOT EXISTS idx_sections_program_id ON sections(program_id)',
      'CREATE INDEX IF NOT EXISTS idx_change_requests_requester_id ON change_requests(requester_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)'
    ];

    for (const indexQuery of indexes) {
      await query(indexQuery);
    }

    console.log('✅ Database schema setup complete!');
    console.log('\n📊 Tables created:');
    console.log('  - programs');
    console.log('  - departments');
    console.log('  - sections');
    console.log('  - students');
    console.log('  - teachers');
    console.log('  - rooms');
    console.log('  - courses');
    console.log('  - labs');
    console.log('  - timetables');
    console.log('  - users');
    console.log('  - change_requests');
    console.log('  - notifications');
    console.log('\n🚀 Your Catalyst database is ready!');

  } catch (error) {
    console.error('❌ Error setting up database schema:', error);
    process.exit(1);
  }
};

// Run the setup
createTables().then(() => {
  console.log('🎉 Setup completed successfully!');
  process.exit(0);
});
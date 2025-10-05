/**
 * Quick start script for Neon database connection
 * This will test your connection and set up basic schema
 */

import { query } from './src/server/neon.ts';

async function quickStart() {
  console.log('🔍 Testing Neon database connection...');

  try {
    // Test basic connection
    const result = await query('SELECT NOW() as current_time, version() as version');
    
    if (result && result.length > 0) {
      console.log('✅ Connection successful!');
      console.log(`📅 Current time: ${result[0].current_time}`);
      console.log(`🐘 Database: ${result[0].version.split(' ')[0]}`);
    }

    // Create a simple test table
    console.log('\n🔧 Setting up basic tables...');
    
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

    console.log('✅ Basic schema created!');
    console.log('\n🎯 What to do next:');
    console.log('1. Update your .env file with your actual Neon DATABASE_URL');
    console.log('2. Test the connection: npm run dev and visit http://localhost:9002/api/test/neon-connection');
    console.log('3. Run the full schema setup: node setup-neon-schema.js');
    console.log('4. Update your API routes to use Neon instead of Supabase');
    
    console.log('\n✨ Your Neon database is ready for Catalyst!');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Make sure you have access to Neon console: https://console.neon.tech');
    console.log('3. Verify your connection string format:');
    console.log('   postgresql://username:password@host/database?sslmode=require');
    process.exit(1);
  }
}

quickStart();
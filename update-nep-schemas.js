import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function updateSchemas() {
  console.log('Updating database schemas to include isNEP columns...\n');

  try {
    // Add isNEP column to students table
    console.log('Adding isNEP column to students table...');
    await sql`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS is_nep BOOLEAN DEFAULT false;
    `;
    console.log('✅ Students table updated');

    // Add isNEP column to courses table  
    console.log('Adding isNEP column to courses table...');
    await sql`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS is_nep BOOLEAN DEFAULT false;
    `;
    console.log('✅ Courses table updated');

    // Check if programs table exists, if not create it
    console.log('Checking programs table...');
    const programsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'programs'
      );
    `;

    if (!programsTableExists[0].exists) {
      console.log('Creating programs table...');
      await sql`
        CREATE TABLE programs (
          id SERIAL PRIMARY KEY,
          custom_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) NOT NULL,
          total_semesters INTEGER NOT NULL DEFAULT 8,
          description TEXT,
          is_nep BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('✅ Programs table created');
    } else {
      // Add isNEP column to existing programs table
      console.log('Adding isNEP column to programs table...');
      await sql`
        ALTER TABLE programs 
        ADD COLUMN IF NOT EXISTS is_nep BOOLEAN DEFAULT false;
      `;
      console.log('✅ Programs table updated');
    }

    // Add additional useful columns for better CSV support
    console.log('Adding additional columns for better CSV support...');
    
    // Add department column to students if not exists
    await sql`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS department VARCHAR(10) DEFAULT 'CSE';
    `;

    // Add department and designation columns to teachers if not exists
    await sql`
      ALTER TABLE teachers 
      ADD COLUMN IF NOT EXISTS department VARCHAR(10) DEFAULT 'CSE',
      ADD COLUMN IF NOT EXISTS designation VARCHAR(50) DEFAULT 'Assistant Professor';
    `;

    // Add department column to courses if not exists  
    await sql`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS department VARCHAR(10) DEFAULT 'CSE';
    `;

    console.log('✅ Additional columns added for CSV compatibility');

    // Show final schema
    console.log('\n📋 Final table schemas:');
    const tables = ['students', 'teachers', 'courses', 'programs', 'rooms'];
    
    for (const table of tables) {
      console.log(`\n${table.toUpperCase()}:`);
      try {
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position;
        `;
        
        columns.forEach(col => {
          const nepIndicator = col.column_name.includes('nep') || col.column_name.includes('is_nep') ? ' 🔥' : '';
          console.log(`  - ${col.column_name}: ${col.data_type}${nepIndicator}`);
        });
      } catch (error) {
        console.log(`  ❌ Table ${table} error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error updating schemas:', error);
  }
}

updateSchemas().catch(console.error);
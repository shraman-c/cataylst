import dotenv from 'dotenv';
import { query } from './src/server/neon';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env as fallback

async function testConnection() {
  console.log('🔍 Testing Neon database connection...');

  try {
    // Test basic connection
    const result = await query('SELECT NOW() as current_time, version() as version');
    
    if (result && result.length > 0) {
      console.log('✅ Connection successful!');
      console.log(`📅 Current time: ${result[0].current_time}`);
      console.log(`🐘 Database: ${result[0].version.split(' ')[0]}`);
      
      console.log('\n🎯 Your Neon database is ready for Catalyst!');
      console.log('\nNext steps:');
      console.log('1. Visit http://localhost:9002/api/test/neon-connection to test via API');
      console.log('2. Update your API routes to use Neon instead of Supabase');
      console.log('3. Run schema setup if needed');
    }
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Make sure you have access to Neon console: https://console.neon.tech');
    console.log('3. Verify your connection string format:');
    console.log('   postgresql://username:password@host/database?sslmode=require');
  }
}

testConnection();
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkRooms() {
  const rooms = await sql`SELECT * FROM rooms`;
  
  console.log('Room analysis:');
  const labRooms = rooms.filter(r => r.is_lab);
  const classRooms = rooms.filter(r => !r.is_lab);
  console.log(`Total rooms: ${rooms.length}`);
  console.log(`Lab rooms: ${labRooms.length}`);
  console.log(`Classroom rooms: ${classRooms.length}`);
  
  console.log('\nLab rooms with capacity:');
  labRooms.forEach(room => {
    console.log(`- ${room.custom_id} (${room.name}): capacity ${room.capacity}`);
  });
  
  console.log('\nClassroom rooms with capacity >= 3:');
  classRooms.filter(r => r.capacity >= 3).forEach(room => {
    console.log(`- ${room.custom_id} (${room.name}): capacity ${room.capacity}`);
  });
  
  // Check maximum capacity
  const maxCapacity = Math.max(...rooms.map(r => r.capacity));
  console.log(`\nMaximum room capacity: ${maxCapacity}`);
}

checkRooms().catch(console.error);
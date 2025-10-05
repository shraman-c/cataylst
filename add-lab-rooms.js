import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function addLabRooms() {
  console.log('Converting some rooms to lab rooms...');
  
  // Convert rooms R26-R30 to be lab rooms
  const labRoomIds = ['R26', 'R27', 'R28', 'R29', 'R30'];
  
  for (const roomId of labRoomIds) {
    await sql`
      UPDATE rooms 
      SET is_lab = true, name = name || ' (Lab)'
      WHERE custom_id = ${roomId}
    `;
    console.log(`Updated ${roomId} to be a lab room`);
  }
  
  // Verify the changes
  const labRooms = await sql`SELECT * FROM rooms WHERE is_lab = true`;
  console.log(`\nNow we have ${labRooms.length} lab rooms:`);
  labRooms.forEach(room => {
    console.log(`- ${room.custom_id} (${room.name}): capacity ${room.capacity}`);
  });
}

addLabRooms().catch(console.error);
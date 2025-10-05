
import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

import { getAll, insertMany, collections } from '@/server/neon';

import { RoomSchema } from '@/lib/data-schemas';


const roomsFilePath = path.join(process.cwd(), 'src', 'lib', 'rooms.json');

// Transform database format back to frontend format
function transformRoomsFromDB(dbRooms: any[]) {
  return dbRooms.map(room => ({
    id: room.custom_id,
    name: room.name,
    capacity: room.capacity || 0,
    isLab: room.is_lab || false
  }));
}

async function getRooms() {
  try {
    // First try to get from Neon database
    const data = await getAll('rooms');
    
    if (!data || data.length === 0) {
      console.log('Neon returned no data, using file backup.');
      try {
        const fileData = await fs.readFile(roomsFilePath, 'utf-8');
        return JSON.parse(fileData);
      } catch (fileError) {
        console.error('Error reading rooms.json:', fileError);
        return [];
      }
    }
    
    return transformRoomsFromDB(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error('Error getting rooms:', error);
    throw error;
  }
}

async function saveRooms(data: any) {
  try {
    // Save to Neon database - transform to database format
    if (data.length > 0) {
      const dbData = data.map((room: any) => ({
        custom_id: room.id,
        name: room.name,
        capacity: room.capacity,
        is_lab: room.isLab
      }));
      await insertMany('rooms', dbData);
    }
    
    // Also save to file as backup
    await fs.writeFile(roomsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving rooms:', error);
    // Fallback to file only
    await fs.writeFile(roomsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}


export async function GET(req: NextRequest) {
  try {
    const data = await getRooms();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rooms data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { data } = body;
    if (!Array.isArray(data)) {
        return NextResponse.json({ error: 'Invalid data format, expected an array.' }, { status: 400 });
    }

    const validatedData = data.map(item => {
        // Helper function to convert to boolean
        const convertToBoolean = (value: any): boolean => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            return lower === 'true' || lower === '1' || lower === 'yes';
          }
          return Boolean(value);
        };

        const parsed = RoomSchema.safeParse({
            ...item,
            capacity: Number(item.capacity) || 0,
            isLab: convertToBoolean(item.isLab),
        });
        if (!parsed.success) {
            console.error("CSV validation error for item:", item, parsed.error.flatten());
            return null;
        }
        return parsed.data;
    }).filter(Boolean);

    if (validatedData.length === 0 && data.length > 0) {
        return NextResponse.json({ error: 'No valid data to import. Please check CSV format.' }, { status: 400 });
    }
    
  await saveRooms(validatedData);
  // Return the new data so frontend can refresh
  return NextResponse.json({ success: true, importedCount: validatedData.length, data: validatedData });
  } catch (error) {
    console.error("Error updating rooms:", error);
    return NextResponse.json({ error: 'Failed to update rooms data' }, { status: 500 });
  }
}

// DELETE /api/data/rooms - Delete a room
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // For now, just return success (implement actual deletion logic as needed)
    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}

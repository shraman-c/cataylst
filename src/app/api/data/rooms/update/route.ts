import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { RoomSchema } from '@/lib/data-schemas';

const roomsFilePath = path.join(process.cwd(), 'src', 'lib', 'rooms.json');

async function getRooms() {
  try {
    const data = await fs.readFile(roomsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function saveRooms(data: any) {
  await fs.writeFile(roomsFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { roomId, updates } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object is required' }, { status: 400 });
    }

    // Get current rooms data
    const rooms = await getRooms();
    
    // Find the room to update
    const roomIndex = rooms.findIndex((room: any) => room.id === roomId);
    
    if (roomIndex === -1) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Update the room with provided updates
    const updatedRoom = { ...rooms[roomIndex], ...updates };

    // Validate the updated room
    try {
      RoomSchema.parse(updatedRoom);
    } catch (validationError) {
      return NextResponse.json({ 
        error: 'Invalid room data', 
        details: validationError 
      }, { status: 400 });
    }

    // Update the room in the array
    rooms[roomIndex] = updatedRoom;

    // Save back to file
    await saveRooms(rooms);

    return NextResponse.json({ 
      success: true, 
      message: 'Room updated successfully',
      room: updatedRoom 
    });

  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ 
      error: 'Failed to update room' 
    }, { status: 500 });
  }
}
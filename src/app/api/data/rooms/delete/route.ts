import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/data/rooms/delete
// Body: { roomId: string }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId } = body;

    if (!roomId || typeof roomId !== 'string') {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    // Stub implementation - can be implemented later when room management is needed
    return NextResponse.json({ 
      success: true, 
      message: `Room deletion requested for ID: ${roomId}`,
      note: 'Room deletion functionality is currently disabled'
    });
    
  } catch (error: any) {
    console.error('Room delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
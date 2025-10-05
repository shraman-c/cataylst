import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/data/programs/delete  
// Body: { programId: string }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { programId } = body;

    if (!programId || typeof programId !== 'string') {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 });
    }

    // Stub implementation - can be implemented later when program management is needed
    return NextResponse.json({ 
      success: true, 
      message: `Program deletion requested for ID: ${programId}`,
      note: 'Program deletion functionality is currently disabled'
    });
    
  } catch (error: any) {
    console.error('Program delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
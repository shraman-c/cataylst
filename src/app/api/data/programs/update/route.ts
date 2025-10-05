import { NextRequest, NextResponse } from 'next/server';

// PUT /api/data/programs/update
// Body: { programId: string, updates: Partial<Program> }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { programId, updates } = body;

    if (!programId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'programId and updates object are required' }, { status: 400 });
    }

    // Stub implementation - can be implemented later when program management is needed
    return NextResponse.json({ 
      success: true, 
      message: `Program update requested for ID: ${programId}`,
      updates: updates,
      note: 'Program update functionality is currently disabled'
    });
    
  } catch (error: any) {
    console.error('Program update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
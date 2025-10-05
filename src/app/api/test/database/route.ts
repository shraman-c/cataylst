import { NextRequest, NextResponse } from 'next/server';
import { find, getAll } from '@/server/neon';

export async function GET(req: NextRequest) {
  try {
    // Test departments and labs
    const departmentData = await getAll('departments');
    const labsData = await getAll('rooms');

    return NextResponse.json({ 
      success: true,
      message: 'Database integration test successful',
      data: {
        departments: departmentData?.length || 0,
        labs: labsData?.length || 0
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
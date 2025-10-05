
import { NextResponse } from 'next/server';

import { query } from '@/server/neon';


export async function GET() {
  try {
    // Test Neon connection
    await query('SELECT 1 as test');
    return NextResponse.json({ status: 'success', message: 'Neon connection successful' });
  } catch (error) {
    console.error('Neon connection failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Neon connection failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

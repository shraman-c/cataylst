import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/server/neon';

export async function POST() {
  try {
    console.log('[Migration] Starting shift removal migration...');

    // Step 1: Drop the shift constraint if it exists
    try {
      await query('ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_shift_check;');
      console.log('[Migration] Constraint dropped successfully');
    } catch (error) {
      console.log('[Migration] Constraint drop result:', error);
    }

    // Step 2: Remove the shift column if it exists
    try {
      await query('ALTER TABLE sections DROP COLUMN IF EXISTS shift;');
      console.log('[Migration] Column dropped successfully');
    } catch (error) {
      console.log('[Migration] Column drop result:', error);
    }

    // Step 3: Update existing sections timestamp
    try {
      await query(`UPDATE sections SET updated_at = NOW() WHERE id IS NOT NULL;`);
      console.log('[Migration] Sections updated successfully');
    } catch (error) {
      console.error('[Migration] Failed to update sections:', error);
      return NextResponse.json({ error: 'Failed to update sections' }, { status: 500 });
    }

    console.log('[Migration] ✅ Shift-based timing removed successfully!');
    
    return NextResponse.json({ 
      message: 'Migration completed successfully',
      status: '✅ Shift-based timing removed! All sections now use standard timing.'
    });

  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
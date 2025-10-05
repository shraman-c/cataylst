import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { update } from '@/server/neon';

const UpdateSectionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  programId: z.string().optional(),
  semester: z.number().optional(),
  capacity: z.number().optional(),
  currentEnrollment: z.number().optional(),
  roomPreference: z.string().optional(),
  shift: z.enum(['morning', 'afternoon', 'evening']).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = UpdateSectionSchema.parse(body);
    const { id, ...updateFields } = validatedData;
    
    try {
      await update('sections', id, updateFields);
    } catch (error) {
      console.error('[API] Failed to update section:', error);
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Section updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('[API] Section update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
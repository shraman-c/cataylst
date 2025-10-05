import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { find, deleteOne } from '@/server/neon';

const DeleteSectionSchema = z.object({
  sectionId: z.string(),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const { sectionId } = DeleteSectionSchema.parse(body);

    try {
      // First, check if the section exists
      const existingSections = await find('sections', { where: `id = '${sectionId}'` });
      
      if (!existingSections || existingSections.length === 0) {
        console.error(`Section not found with ID: ${sectionId}`);
        return NextResponse.json({ 
          error: 'Section not found', 
          sectionId 
        }, { status: 404 });
      }
      
      const existingSection = existingSections[0];

      // Check for dependencies (students assigned to this section)
      const students = await find('students', { where: `section_id = '${sectionId}'` });

      if (students && students.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot delete section',
          reason: 'Section has students assigned to it',
          dependencies: students.length
        }, { status: 409 });
      }
      
      // Delete the section
      const deleted = await deleteOne('sections', sectionId);
      
      if (!deleted) {
        console.error('Failed to delete section');
        return NextResponse.json({ 
          error: 'Failed to delete section'
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Section deleted successfully`,
      deletedSectionId: sectionId
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('[API] Section deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
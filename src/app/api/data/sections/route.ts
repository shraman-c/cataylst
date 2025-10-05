import { NextRequest, NextResponse } from 'next/server';
import { getAll, insertMany, deleteOne, update } from '@/server/neon';
import { SectionSchema } from '@/lib/data-schemas';
import { z } from 'zod';

export async function GET() {
  try {
    const dbSections = await getAll('sections');
    
    // Transform database format back to frontend format
    const sections = dbSections.map((section: any) => ({
      id: section.custom_id,                    // Map custom_id to id
      name: section.section_name,               // Map section_name to name
      programId: section.program_id,            // Map program_id to programId
      semester: section.semester,
      capacity: section.max_students,           // Map max_students to capacity
      currentEnrollment: 0,                     // Default value (not stored in DB yet)
      isActive: true,                           // Default value (not stored in DB yet)
      academicYear: '2024-25'                   // Default value (not stored in DB yet)
    }));
    
    return NextResponse.json(sections);
  } catch (error) {
    console.error('[API] Sections fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both single object and array inputs
    const inputSections = Array.isArray(body) ? body : [body];
    
    // Validate each section
    const sections = inputSections.map(section => {
      const validatedData = SectionSchema.parse(section);
      return validatedData;
    });
    
    // Transform frontend fields to database column names
    const dbSections = sections.map((section: any) => ({
      custom_id: section.id,                    // Map id to custom_id
      section_name: section.name,               // Map name to section_name
      program_id: section.programId,            // Map programId to program_id
      semester: section.semester,
      max_students: section.capacity            // Map capacity to max_students
    }));
    
    await insertMany('sections', dbSections);
    
    return NextResponse.json({ message: 'Section(s) created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.errors 
      }, { status: 400 });
    }
    console.error('[API] Section creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    
    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Validate the section data
    const validatedData = SectionSchema.parse(body);
    
    // Transform to database format
    const dbData = {
      custom_id: validatedData.id,
      section_name: validatedData.name,
      program_id: validatedData.programId,
      semester: validatedData.semester,
      max_students: validatedData.capacity
    };

    // Update the section
    const updatedSection = await update('sections', sectionId, dbData);
    
    if (!updatedSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Transform back to frontend format
    const responseData = {
      id: updatedSection.custom_id,
      name: updatedSection.section_name,
      programId: updatedSection.program_id,
      semester: updatedSection.semester,
      capacity: updatedSection.max_students,
      currentEnrollment: 0,
      isActive: true,
      academicYear: '2024-25'
    };

    return NextResponse.json({ message: 'Section updated successfully', section: responseData });
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    
    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    // Delete the section from database
    const deleted = await deleteOne('sections', sectionId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('[API] Section deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
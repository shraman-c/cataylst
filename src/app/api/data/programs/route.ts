import { NextRequest, NextResponse } from 'next/server';
import { ProgramSchema } from '@/lib/data-schemas';
import { getAll, insertMany } from '@/server/neon';
import fs from 'fs/promises';
import path from 'path';

const programsFilePath = path.join(process.cwd(), 'src', 'lib', 'programs.json');

// Transform database format back to frontend format
function transformProgramsFromDB(dbPrograms: any[]) {
  return dbPrograms.map(program => ({
    id: program.custom_id,
    name: program.name,
    code: program.code,
    totalSemesters: program.total_semesters || 8,
    description: program.description || '',
    isNEP: program.is_nep || false
  }));
}

async function getPrograms() {
  try {
    // First try to get from Neon database
    const data = await getAll('programs');
    
    if (!data || data.length === 0) {
      console.log('Neon returned no data, using file backup.');
      // Fallback to file
      try {
        const fileData = await fs.readFile(programsFilePath, 'utf-8');
        return JSON.parse(fileData);
      } catch (fileError) {
        return [];
      }
    }

    // Transform database format to frontend format
    return transformProgramsFromDB(data);
  } catch (error) {
    console.error('Error getting programs:', error);
    return [];
  }
}

async function savePrograms(data: any) {
  try {
    // Save to Neon database - transform to database format
    if (data.length > 0) {
      const dbData = data.map((program: any) => ({
        custom_id: program.id,
        name: program.name,
        code: program.code,
        total_semesters: program.totalSemesters,
        description: program.description,
        is_nep: program.isNEP
      }));
      await insertMany('programs', dbData);
    }
    
    // Also save to file as backup
    await fs.writeFile(programsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving programs:', error);
    // Fallback to file only
    await fs.writeFile(programsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export async function GET() {
  try {
    const data = await getPrograms();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading programs data:', error);
    return NextResponse.json({ error: 'Failed to read programs data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    // Handle bulk upload
    if (body.data && Array.isArray(body.data)) {
      const { data } = body;
      
      const validatedData = data.map((item: any) => {
        // Helper function to convert to boolean
        const convertToBoolean = (value: any): boolean => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            return lower === 'true' || lower === '1' || lower === 'yes';
          }
          return Boolean(value);
        };

        const parsed = ProgramSchema.safeParse({
            ...item,
            totalSemesters: Number(item.totalSemesters) || 8,
            isNEP: convertToBoolean(item.isNEP),
            description: item.description || ''
        });
        if (!parsed.success) {
            console.error("CSV validation error for item:", item, parsed.error.flatten());
            return null;
        }
        return parsed.data;
      }).filter(Boolean);

      if (validatedData.length === 0 && data.length > 0) {
          return NextResponse.json({ error: 'No valid data to import. Please check CSV format.' }, { status: 400 });
      }
      
      await savePrograms(validatedData);
      return NextResponse.json({ success: true, importedCount: validatedData.length, data: validatedData });
    }
    
    // Handle single program add
    const result = ProgramSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    
    const programs = await getPrograms();
    // Prevent duplicate id
    if (programs.some((p: any) => p.id === body.id)) {
      return NextResponse.json({ error: 'Program with this id already exists' }, { status: 409 });
    }
    
    // Always ensure description is a string
    const programToAdd = { ...result.data, description: result.data.description ?? '' };
    programs.push(programToAdd);
    await savePrograms(programs);
    return NextResponse.json(programToAdd, { status: 201 });
  } catch (error) {
    console.error("Error updating programs:", error);
    return NextResponse.json({ error: 'Failed to update programs data' }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = ProgramSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }
    
    const programs = await getPrograms();
    const idx = programs.findIndex((p: any) => p.id === body.id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    
    // Always ensure description is a string
    const programToUpdate = { ...result.data, description: result.data.description ?? '' };
    programs[idx] = programToUpdate;
    await savePrograms(programs);
    return NextResponse.json(programToUpdate);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

// Delete a program
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('programId');
    
    if (!id) {
      return NextResponse.json({ error: 'id or programId query parameter required' }, { status: 400 });
    }
    
    const programs = await getPrograms();
    const idx = programs.findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    
    const deleted = programs.splice(idx, 1)[0];
    await savePrograms(programs);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}

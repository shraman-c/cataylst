import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LabSchema } from '@/lib/data-schemas';

// GET /api/data/labs - Get all labs
export async function GET() {
  try {
    // For now, return a default set of labs
    // In a real app, this would come from a database
    const labs = [
      { 
        id: 'lab_cse_001', 
        name: 'Programming Lab 1', 
        labCode: 'CSE-PL1', 
        departmentCode: 'CSE', 
        capacity: 30, 
        equipment: ['Computers', 'Projector', 'Whiteboard'],
        labIncharge: 'T001',
        isActive: true,
        location: 'Block A, Floor 2',
        description: 'Programming and software development lab'
      },
      { 
        id: 'lab_cse_002', 
        name: 'Network Lab', 
        labCode: 'CSE-NL1', 
        departmentCode: 'CSE', 
        capacity: 25, 
        equipment: ['Routers', 'Switches', 'Cables', 'Computers'],
        labIncharge: 'T002',
        isActive: true,
        location: 'Block A, Floor 3',
        description: 'Network configuration and testing lab'
      },
      { 
        id: 'lab_ece_001', 
        name: 'Electronics Lab', 
        labCode: 'ECE-EL1', 
        departmentCode: 'ECE', 
        capacity: 20, 
        equipment: ['Oscilloscopes', 'Function Generators', 'Multimeters', 'Breadboards'],
        labIncharge: 'T003',
        isActive: true,
        location: 'Block B, Floor 1',
        description: 'Basic electronics and circuits lab'
      },
      { 
        id: 'lab_eee_001', 
        name: 'Power Systems Lab', 
        labCode: 'EEE-PS1', 
        departmentCode: 'EEE', 
        capacity: 15, 
        equipment: ['Power Supplies', 'Transformers', 'Motors', 'Control Panels'],
        labIncharge: 'T004',
        isActive: true,
        location: 'Block B, Floor 2',
        description: 'Power systems and electrical machines lab'
      },
      { 
        id: 'lab_mech_001', 
        name: 'Manufacturing Lab', 
        labCode: 'MECH-ML1', 
        departmentCode: 'MECH', 
        capacity: 12, 
        equipment: ['Lathes', 'Milling Machines', 'Drill Press', 'Measuring Tools'],
        labIncharge: 'T005',
        isActive: true,
        location: 'Workshop Block',
        description: 'Mechanical manufacturing and machining lab'
      },
      { 
        id: 'lab_chem_001', 
        name: 'Organic Chemistry Lab', 
        labCode: 'CHEM-OL1', 
        departmentCode: 'CHEM', 
        capacity: 18, 
        equipment: ['Fume Hoods', 'Glassware', 'Heating Mantles', 'Rotary Evaporator'],
        labIncharge: 'T006',
        isActive: true,
        location: 'Block C, Floor 1',
        description: 'Organic chemistry synthesis and analysis lab'
      }
    ];

    return NextResponse.json(labs);
  } catch (error) {
    console.error('Failed to fetch labs:', error);
    return NextResponse.json({ error: 'Failed to fetch labs' }, { status: 500 });
  }
}

// POST /api/data/labs - Create a new lab
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = LabSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid lab data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const lab = validation.data;
    
    // In a real app, you would save to database here
    // For now, just return the created lab
    const createdLab = {
      ...lab,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(createdLab, { status: 201 });
  } catch (error) {
    console.error('Failed to create lab:', error);
    return NextResponse.json({ error: 'Failed to create lab' }, { status: 500 });
  }
}

// PUT /api/data/labs - Update a lab
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = LabSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid lab data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const lab = validation.data;
    
    // In a real app, you would update in database here
    // For now, just return the updated lab
    const updatedLab = {
      ...lab,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedLab);
  } catch (error) {
    console.error('Failed to update lab:', error);
    return NextResponse.json({ error: 'Failed to update lab' }, { status: 500 });
  }
}

// DELETE /api/data/labs - Delete a lab
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Lab ID is required' }, { status: 400 });
    }

    // In a real app, you would delete from database here
    // For now, just return success
    return NextResponse.json({ message: 'Lab deleted successfully' });
  } catch (error) {
    console.error('Failed to delete lab:', error);
    return NextResponse.json({ error: 'Failed to delete lab' }, { status: 500 });
  }
}
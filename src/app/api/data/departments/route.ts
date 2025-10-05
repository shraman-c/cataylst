import { NextRequest, NextResponse } from 'next/server';
import { DepartmentSchema } from '@/lib/data-schemas';
import fs from 'fs/promises';
import path from 'path';

const departmentsFilePath = path.join(process.cwd(), 'src', 'lib', 'departments.json');

// GET /api/data/departments - Get all departments
export async function GET() {
  try {
    const fileData = await fs.readFile(departmentsFilePath, 'utf-8');
    const departments = JSON.parse(fileData);
    return NextResponse.json(departments);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json([]); // If file doesn't exist, return empty array
    }
    console.error('Failed to fetch departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

// POST /api/data/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate the request body
    const validation = DepartmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid department data', details: validation.error.errors },
        { status: 400 }
      );
    }
    const department = validation.data;
    // Read current departments
    let departments = [];
    try {
      const fileData = await fs.readFile(departmentsFilePath, 'utf-8');
      departments = JSON.parse(fileData);
      if (!Array.isArray(departments)) departments = [];
    } catch (e) {
      departments = [];
    }
    // Remove any with same code
    departments = departments.filter((d: any) => d.code !== department.code);
    departments.push({ ...department, isActive: true });
    await fs.writeFile(departmentsFilePath, JSON.stringify(departments, null, 2), 'utf-8');
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Failed to create department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}

// PUT /api/data/departments - Update a department
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validation = DepartmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid department data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const department = validation.data;
    
    // In a real app, you would update in database here
    // For now, just return the updated department
    const updatedDepartment = {
      ...department,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error('Failed to update department:', error);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

// DELETE /api/data/departments - Delete a department
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: 'Department code is required' }, { status: 400 });
    }

    // In a real app, you would delete from database here
    // For now, just return success
    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Failed to delete department:', error);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
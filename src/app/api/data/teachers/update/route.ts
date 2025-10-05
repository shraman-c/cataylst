import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TeacherSchema } from '@/lib/data-schemas';

const teachersFilePath = path.join(process.cwd(), 'src', 'lib', 'teachers.json');

async function readTeachers() {
  try {
    const raw = await fs.readFile(teachersFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e: any) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeTeachers(data: any) {
  await fs.writeFile(teachersFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

// PUT /api/data/teachers/update
// Body: { teacherId: string, updates: Partial<Teacher> }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherId, updates } = body;

    if (!teacherId || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'teacherId and updates object are required' }, { status: 400 });
    }

    const teachers = await readTeachers();
    const idx = teachers.findIndex((t: any) => t.id === teacherId);
    if (idx === -1) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Validate updated teacher
    const candidate = { ...teachers[idx], ...updates };
    const parsed = TeacherSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid teacher data', details: parsed.error.flatten() }, { status: 400 });
    }

    teachers[idx] = parsed.data;
    await writeTeachers(teachers);

    return NextResponse.json({ success: true, teacher: parsed.data });
  } catch (e: any) {
    console.error('Teacher update failed:', e);
    return NextResponse.json({ error: 'Failed to update teacher' }, { status: 500 });
  }
}
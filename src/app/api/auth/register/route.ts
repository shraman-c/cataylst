import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import { readAccountRegistry, writeAccountRegistry, hasRegistryAccount } from '@/lib/auth-registry';
import { createSupabaseAdminClient, createSupabaseAuthClient, toSupabaseEmail } from '@/lib/supabase-auth';

const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');
const teachersFilePath = path.join(process.cwd(), 'src', 'lib', 'teachers.json');

async function getJSONData(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function createSupabaseAccount(args: {
  email: string;
  password: string;
  metadata: Record<string, string>;
}) {
  const useAdminClient = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = useAdminClient ? createSupabaseAdminClient() : createSupabaseAuthClient();

  if (useAdminClient) {
    return supabase.auth.admin.createUser({
      email: args.email,
      password: args.password,
      email_confirm: true,
      user_metadata: args.metadata,
    });
  }

  return supabase.auth.signUp({
    email: args.email,
    password: args.password,
    options: {
      data: args.metadata,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { userId, password, role } = body;

    if (!userId || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const allStudents = await getJSONData(studentsFilePath);
    const allTeachers = await getJSONData(teachersFilePath);
    const registry = await readAccountRegistry();

    let username: string;
    let name: string;
    let profileId: string;

    if (role === 'student') {
      const selectedStudent = allStudents.find((student: any) => student.id === userId);
      if (!selectedStudent) return NextResponse.json({ error: 'Selected student not found' }, { status: 404 });

      username = selectedStudent.studentId;
      name = selectedStudent.name;
      profileId = selectedStudent.id;
    } else if (role === 'teacher') {
      const selectedTeacher = allTeachers.find((teacher: any) => teacher.id === userId);
      if (!selectedTeacher) return NextResponse.json({ error: 'Selected teacher not found' }, { status: 404 });

      username = selectedTeacher.teacherId;
      name = selectedTeacher.name;
      profileId = selectedTeacher.id;
    } else {
      username = userId;
      name = 'Admin';
      profileId = userId;
    }

    const email = toSupabaseEmail(username);
    if (hasRegistryAccount(registry, { profileId, username, email })) {
      return NextResponse.json({ error: 'User account already exists for this ID' }, { status: 409 });
    }

    const metadata = {
      name,
      role,
      username,
      profileId,
    };

    const { data, error } = await createSupabaseAccount({
      email,
      password,
      metadata,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Failed to create Supabase user' }, { status: 400 });
    }

    await writeAccountRegistry([
      ...registry,
      {
        id: profileId,
        profileId,
        authUserId: data.user.id,
        username,
        email,
        name,
        role,
      },
    ]);

    return NextResponse.json({ success: true, userId: profileId }, { status: 201 });
  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred during registration.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const students = await getJSONData(studentsFilePath);
    const teachers = await getJSONData(teachersFilePath);
    const registry = await readAccountRegistry();

    const userIdsWithAccounts = new Set(
      registry.flatMap((entry) => [entry.id, entry.profileId, entry.username, entry.email].filter(Boolean).map(String))
    );

    const availableStudents = students.filter((student: any) => !userIdsWithAccounts.has(student.id) && !userIdsWithAccounts.has(student.studentId));
    const availableTeachers = teachers.filter((teacher: any) => !userIdsWithAccounts.has(teacher.id) && !userIdsWithAccounts.has(teacher.teacherId));

    return NextResponse.json({ students: availableStudents, teachers: availableTeachers });
  } catch (err: any) {
    console.error('Failed to get available users:', err);
    return NextResponse.json({ error: 'Failed to fetch available users' }, { status: 500 });
  }
}
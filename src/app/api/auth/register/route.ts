
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

import { StudentSchema, TeacherSchema } from '@/lib/data-schemas';
import { readAccountRegistry, writeAccountRegistry, hasRegistryAccount } from '@/lib/auth-registry';
import { createSupabaseAuthClient, toSupabaseEmail } from '@/lib/supabase-auth';

const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');
const teachersFilePath = path.join(process.cwd(), 'src', 'lib', 'teachers.json');

async function getJSONData(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []; // If the file doesn't exist, return an empty array
    import { createSupabaseAdminClient, createSupabaseAuthClient, toSupabaseEmail } from '@/lib/supabase-auth';
    throw error;
  }
}


export async function POST(req: NextRequest) {
  try {
    let body;
    try {
        body = await req.json();
    } catch(e) {
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

    let selectedUser: any;
    let username: string;
    let name: string;
    let profileId: string;

    if (role === 'student') {
        selectedUser = allStudents.find((s: any) => s.id === userId);
        if (!selectedUser) return NextResponse.json({ error: 'Selected student not found' }, { status: 404 });
        username = selectedUser.studentId;
        name = selectedUser.name;
        profileId = selectedUser.id;
    } else if (role === 'teacher') {
        selectedUser = allTeachers.find((t: any) => t.id === userId);
        if (!selectedUser) return NextResponse.json({ error: 'Selected teacher not found' }, { status: 404 });
        username = selectedUser.teacherId;
        name = selectedUser.name;
        profileId = selectedUser.id;
    } else { // admin
        username = userId; // For admin, userId is the username
        name = 'Admin';
        profileId = userId;
    }

    const email = toSupabaseEmail(username);
    if (hasRegistryAccount(registry, { profileId, username, email })) {
      return NextResponse.json({ error: 'User account already exists for this ID' }, { status: 409 });
    }

    const supabase = createSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          username,
          profileId,
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Failed to create Supabase user' }, { status: 400 });
    }

    await writeAccountRegistry([
      ...registry,
      {
        id: profileId,
        profileId,
        const authPayload = {
          email,
          password,
        };

        const userMetadata = {
          name,
          role,
          username,
          profileId,
        };

        const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseAdminClient()
          : createSupabaseAuthClient();

        const { data, error } = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? await supabase.auth.admin.createUser({
              ...authPayload,
              email_confirm: true,
              user_metadata: userMetadata,
            })
          : await supabase.auth.signUp({
              ...authPayload,
              options: {
                data: userMetadata,
              },
            });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
        const students = await getJSONData(studentsFilePath);
        const teachers = await getJSONData(teachersFilePath);
        const registry = await readAccountRegistry();

        const userIdsWithAccounts = new Set(
          registry.flatMap((entry) => [entry.id, entry.profileId, entry.username, entry.email].filter(Boolean).map(String))
        );
        
        const availableStudents = students.filter((s: any) => !userIdsWithAccounts.has(s.id) && !userIdsWithAccounts.has(s.studentId));
        const availableTeachers = teachers.filter((t: any) => !userIdsWithAccounts.has(t.id) && !userIdsWithAccounts.has(t.teacherId));

        return NextResponse.json({ students: availableStudents, teachers: availableTeachers });

    } catch(err: any) {
        console.error("Failed to get available users:", err);
        return NextResponse.json({ error: 'Failed to fetch available users' }, { status: 500 });
    }
}

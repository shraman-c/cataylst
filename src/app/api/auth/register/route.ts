
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';




import { StudentSchema, TeacherSchema } from '@/lib/data-schemas';

// Define the path to the users.json file
const usersFilePath = path.join(process.cwd(), 'src', 'lib', 'users.json');
const studentsFilePath = path.join(process.cwd(), 'src', 'lib', 'students.json');
const teachersFilePath = path.join(process.cwd(), 'src', 'lib', 'teachers.json');


async function getJSONData(filePath: string) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return []; // If the file doesn't exist, return an empty array
        }
        throw error;
    }
}

async function saveUsers(users: any) {
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
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

    const users = await getJSONData(usersFilePath);
    const allStudents = await getJSONData(studentsFilePath);
    const allTeachers = await getJSONData(teachersFilePath);

    let selectedUser: any;
    let username: string;
    let name: string;

    if (role === 'student') {
        selectedUser = allStudents.find((s: any) => s.id === userId);
        if (!selectedUser) return NextResponse.json({ error: 'Selected student not found' }, { status: 404 });
        username = selectedUser.studentId;
        name = selectedUser.name;
    } else if (role === 'teacher') {
        selectedUser = allTeachers.find((t: any) => t.id === userId);
        if (!selectedUser) return NextResponse.json({ error: 'Selected teacher not found' }, { status: 404 });
        username = selectedUser.teacherId;
        name = selectedUser.name;
    } else { // admin
        username = userId; // For admin, userId is the username
        name = 'Admin';
    }


    const existingUser = users.find((u: any) => u.username === username);
    if (existingUser) {
      return NextResponse.json({ error: 'User account already exists for this ID' }, { status: 409 });
    }

    const newUser = {
      id: selectedUser ? selectedUser.id : `user-${Date.now()}`,
      username,
      password: password, // Storing plain text password as requested
      name,
      role,
    };
    
    users.push(newUser);
    await saveUsers(users);


    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });

  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ error: 'An error occurred during registration.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
        const users = await getJSONData(usersFilePath);
        const students = await getJSONData(studentsFilePath);
        const teachers = await getJSONData(teachersFilePath);

        const userIdsWithAccounts = new Set(users.map((u: any) => u.id));
        
        const availableStudents = students.filter((s: any) => !userIdsWithAccounts.has(s.id));
        const availableTeachers = teachers.filter((t: any) => !userIdsWithAccounts.has(t.id));

        return NextResponse.json({ students: availableStudents, teachers: availableTeachers });

    } catch(err: any) {
        console.error("Failed to get available users:", err);
        return NextResponse.json({ error: 'Failed to fetch available users' }, { status: 500 });
    }
}

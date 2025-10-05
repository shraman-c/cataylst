
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Define the path to the users.json file
const usersFilePath = path.join(process.cwd(), 'src', 'lib', 'users.json');

async function getUsers() {
  try {
    const data = await fs.readFile(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((u: any) => u.username === username);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = password === user.password;

    if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('NEXTAUTH_SECRET is not defined in the environment variables.');
    }

    // Create JWT
    const token = await new SignJWT({ userId: user.id, role: user.role, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Token expires in 1 hour
      .sign(new TextEncoder().encode(secret));

    // Set cookie on the response (Next.js 15)
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
    res.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return res;

  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    console.log('Login attempt for username:', username);
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Find user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.log('User not found in database for username:', username);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('User found in DB. Comparing passwords...');
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Password verification failed for user:', username);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('Password verified successfully. Issuing JWT...');
    // Generate JWT session token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const cookieStore = await cookies();
    cookieStore.set('auth-token', {
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      } 
    });
    
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

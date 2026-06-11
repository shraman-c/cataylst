import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { username, password, name } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const customId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        custom_id: customId,
        username,
        password: hashedPassword,
        name: name || username,
        role: 'student',
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Registration failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data });
    
  } catch (err: any) {
    console.error("Signup Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

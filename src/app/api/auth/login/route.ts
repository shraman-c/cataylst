
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAuthClient, mapSupabaseUserToAppUser, setSupabaseAuthCookies, toSupabaseEmail } from '@/lib/supabase-auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const supabase = createSupabaseAuthClient();
    const email = toSupabaseEmail(username);
    const authResult = await supabase.auth.signInWithPassword({ email, password });

    if (authResult.error || !authResult.data.session || !authResult.data.user) {
      return NextResponse.json({ error: authResult.error?.message || 'Invalid credentials' }, { status: 401 });
    }

    const user = mapSupabaseUserToAppUser(authResult.data.user);
    const response = NextResponse.json({ success: true, user });
    setSupabaseAuthCookies(response, authResult.data.session);

    return response;

  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

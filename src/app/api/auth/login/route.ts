
import { NextRequest, NextResponse } from 'next/server';
import { readAccountRegistry } from '@/lib/auth-registry';
import { createSupabaseAdminClient, createSupabaseAuthClient, mapSupabaseUserToAppUser, setSupabaseAuthCookies, toSupabaseEmail } from '@/lib/supabase-auth';

const ADMIN_BOOTSTRAP_EMAIL = 'mail.sc980@gmail.com';

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
      const registry = await readAccountRegistry();
      const fallbackAccount = registry.find((entry) => {
        const candidateValues = [entry.username, entry.email, entry.id, entry.profileId].filter(Boolean).map(String);
        return candidateValues.includes(username);
      }) as any | undefined;

      const isBootstrapAdmin = username.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;

      if (!fallbackAccount || fallbackAccount.password !== password) {
        if (!isBootstrapAdmin) {
          return NextResponse.json({ error: authResult.error?.message || 'Invalid credentials' }, { status: 401 });
        }
      }

      if (isBootstrapAdmin) {
        const adminClient = createSupabaseAdminClient();
        const bootstrapResult = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: 'Admin',
            role: 'admin',
            username,
            profileId: username,
          },
        });

        if (!bootstrapResult.error || bootstrapResult.data.user) {
          const retryBootstrap = await supabase.auth.signInWithPassword({ email, password });

          if (!retryBootstrap.error && retryBootstrap.data.session && retryBootstrap.data.user) {
            const bootstrapUser = mapSupabaseUserToAppUser(retryBootstrap.data.user);
            const bootstrapResponse = NextResponse.json({ success: true, user: bootstrapUser });
            setSupabaseAuthCookies(bootstrapResponse, retryBootstrap.data.session);
            return bootstrapResponse;
          }
        }
      }

      const provisionResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fallbackAccount.name || username,
            role: fallbackAccount.role || 'student',
            username,
            profileId: fallbackAccount.profileId || fallbackAccount.id || username,
          },
        },
      });

      if (provisionResult.error || !provisionResult.data.user) {
        return NextResponse.json({ error: provisionResult.error?.message || 'Invalid credentials' }, { status: 401 });
      }

      if (provisionResult.data.session && provisionResult.data.user) {
        const provisionedUser = mapSupabaseUserToAppUser(provisionResult.data.user);
        const provisionedResponse = NextResponse.json({ success: true, user: provisionedUser });
        setSupabaseAuthCookies(provisionedResponse, provisionResult.data.session);

        return provisionedResponse;
      }

      const retryResult = await supabase.auth.signInWithPassword({ email, password });

      if (retryResult.error || !retryResult.data.session || !retryResult.data.user) {
        return NextResponse.json({ error: retryResult.error?.message || 'Invalid credentials' }, { status: 401 });
      }

      const provisionedUser = mapSupabaseUserToAppUser(retryResult.data.user);
      const provisionedResponse = NextResponse.json({ success: true, user: provisionedUser });
      setSupabaseAuthCookies(provisionedResponse, retryResult.data.session);

      return provisionedResponse;
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

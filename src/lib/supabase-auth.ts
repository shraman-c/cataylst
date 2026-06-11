import { createClient, type Session, type User } from '@supabase/supabase-js';
import { decodeJwt } from 'jose';
import { NextResponse } from 'next/server';

export const SUPABASE_AUTH_COOKIE_NAMES = {
  access: 'sb-access-token',
  refresh: 'sb-refresh-token',
} as const;

const AUTH_EMAIL_DOMAIN = 'catalyst.local';

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function createSupabaseAuthClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in the environment variables.');
  }

  if (!supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not defined in the environment variables.');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in the environment variables.');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin auth operations.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function normalizeAuthIdentifier(identifier: string) {
  return identifier.trim();
}

export function toSupabaseEmail(identifier: string) {
  const normalized = normalizeAuthIdentifier(identifier);

  if (normalized.includes('@')) {
    return normalized.toLowerCase();
  }

  const localPart = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'user';

  return `${localPart}@${AUTH_EMAIL_DOMAIN}`;
}

export type AppSessionUser = {
  userId: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  email?: string;
  authUserId?: string;
};

export function mapSupabaseUserToAppUser(user: User): AppSessionUser {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  const role = (metadata.role as AppSessionUser['role']) || 'student';
  const name = (metadata.name as string) || user.email?.split('@')[0] || 'User';
  const userId =
    (metadata.profileId as string) ||
    (metadata.userId as string) ||
    (metadata.username as string) ||
    user.email?.split('@')[0] ||
    user.id;

  return {
    userId,
    name,
    role,
    email: user.email || undefined,
    authUserId: user.id,
  };
}

export async function getAppUserFromAccessToken(accessToken: string) {
  try {
    const payload = decodeJwt(accessToken) as Record<string, unknown>;
    const metadata = (payload.user_metadata || {}) as Record<string, unknown>;
    const role = (metadata.role as AppSessionUser['role']) || (payload.role as AppSessionUser['role']) || 'student';
    const name = (metadata.name as string) || (payload.name as string) || 'User';
    const userId =
      (metadata.profileId as string) ||
      (metadata.userId as string) ||
      (metadata.username as string) ||
      (payload.sub as string) ||
      'user';

    return {
      userId,
      name,
      role,
      email: (payload.email as string) || undefined,
      authUserId: (payload.sub as string) || undefined,
    };
  } catch {
    return null;
  }
}

export function setSupabaseAuthCookies(response: NextResponse, session: Session) {
  response.cookies.set(SUPABASE_AUTH_COOKIE_NAMES.access, session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: session.expires_in,
  });

  response.cookies.set(SUPABASE_AUTH_COOKIE_NAMES.refresh, session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSupabaseAuthCookies(response: NextResponse) {
  response.cookies.set(SUPABASE_AUTH_COOKIE_NAMES.access, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(SUPABASE_AUTH_COOKIE_NAMES.refresh, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
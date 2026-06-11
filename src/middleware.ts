
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_AUTH_COOKIE_NAMES, clearSupabaseAuthCookies, getAppUserFromAccessToken } from '@/lib/supabase-auth'

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(SUPABASE_AUTH_COOKIE_NAMES.access)?.value;
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');

  if (!accessToken) {
    if (isDashboardRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  const user = await getAppUserFromAccessToken(accessToken);

  if (!user) {
    const response = isDashboardRoute ? NextResponse.redirect(new URL('/login', request.url)) : NextResponse.next();
    clearSupabaseAuthCookies(response);
    return response;
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login/:path*'],
}

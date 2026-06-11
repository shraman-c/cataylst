
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_AUTH_COOKIE_NAMES } from './src/lib/supabase-auth'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(SUPABASE_AUTH_COOKIE_NAMES.access)?.value;

  if (!accessToken) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/login/:path*'],
}

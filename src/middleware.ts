
import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token');

  // Allow dashboard access without authentication for development
  // Remove this comment and uncomment the redirect if you want to enforce authentication
  /*
  if (!sessionToken?.value) {
    if(request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/', request.url))
    }
  } else {
      if(request.nextUrl.pathname.startsWith('/login')) {
         return NextResponse.redirect(new URL('/dashboard', request.url))
      }
  }
  */

  // Only redirect from login to dashboard if user is authenticated
  if (sessionToken?.value && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login/:path*'],
}


import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token');

  if (!sessionToken) {
    if(request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', request.url))
    }
  } else {
      if(request.nextUrl.pathname.startsWith('/login')) {
         return NextResponse.redirect(new URL('/dashboard', request.url))
      }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}

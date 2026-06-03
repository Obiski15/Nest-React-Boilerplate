import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AUTH_ROUTES } from './constants';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.next();
  }

  const hasRefreshToken = request.cookies.has('refresh_token');

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!isAuthRoute && !hasRefreshToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

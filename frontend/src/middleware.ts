import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // We'll handle authentication client-side instead of in middleware
  // This is because we're using localStorage for token storage, which isn't accessible in middleware
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};

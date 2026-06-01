import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  // Middleware disabled - auth checks moved to page components
  // This avoids potential cookie issues in Next.js 16 middleware
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

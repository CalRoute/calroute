import { NextRequest, NextResponse } from 'next/server'

const SESSION_MAX_AGE = 60 * 60            // 1 hour
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60 // 14 days

export async function proxy(request: NextRequest) {
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  if (!isDashboardRoute) return NextResponse.next()

  const session = request.cookies.get('calroute-session')?.value
  const refresh = request.cookies.get('calroute-refresh')?.value

  // Has a valid (non-expired) session token — proceed
  if (session) return NextResponse.next()

  // No session but has a refresh token — silently refresh
  if (refresh) {
    try {
      const res = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
        }
      )

      if (!res.ok) throw new Error('refresh failed')

      const { id_token: newIdToken, refresh_token: newRefresh } = await res.json()

      // Proceed to the page and set the new tokens in the response
      const response = NextResponse.next()
      response.cookies.set('calroute-session', newIdToken, {
        httpOnly: true,
        secure: true,
        maxAge: SESSION_MAX_AGE,
        path: '/',
        sameSite: 'lax',
      })
      if (newRefresh && newRefresh !== refresh) {
        response.cookies.set('calroute-refresh', newRefresh, {
          httpOnly: true,
          secure: true,
          maxAge: REFRESH_MAX_AGE,
          path: '/',
          sameSite: 'lax',
        })
      }
      return response
    } catch {
      // Refresh failed — fall through to login redirect
    }
  }

  // No valid session, no refresh token — redirect to login
  console.log('[proxy] no session/refresh for', request.nextUrl.pathname, '— redirecting to login')
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('returnTo', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

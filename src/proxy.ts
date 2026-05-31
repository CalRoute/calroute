import { NextRequest, NextResponse } from 'next/server'
import { verifySession, signSession, decodeFirebaseTokenPayload } from '@/lib/session-jwt'

const SESSION_MAX_AGE = 14 * 24 * 60 * 60 // 14 days
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60 // 14 days

export async function proxy(request: NextRequest) {
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  if (!isDashboardRoute) return NextResponse.next()

  const sessionToken = request.cookies.get('calroute-session')?.value
  const refresh = request.cookies.get('calroute-refresh')?.value

  // Valid session — proceed
  if (sessionToken) {
    const payload = await verifySession(sessionToken)
    if (payload) return NextResponse.next()
  }

  // No valid session but has refresh token — get a new Firebase token and sign our own
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

      // Decode the Firebase token to get uid/email (already validated by Firebase)
      const { uid, email } = decodeFirebaseTokenPayload(newIdToken)
      if (!uid) throw new Error('no uid in token')

      // Sign our own session JWT
      const newSessionToken = await signSession({ uid, email: email ?? '' })

      const response = NextResponse.next()
      response.cookies.set('calroute-session', newSessionToken, {
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

  // No valid session — redirect to login
  console.log('[proxy] no session/refresh for', request.nextUrl.pathname)
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

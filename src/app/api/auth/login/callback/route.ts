export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

const SESSION_MAX_AGE = 60 * 60           // 1 hour  — matches Firebase ID token lifetime
const REFRESH_MAX_AGE = 14 * 24 * 60 * 60 // 14 days — Firebase refresh tokens don't expire

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const storedState = request.cookies.get('login_state')?.value

  if (!code || !stateParam || stateParam !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`)
  }

  let returnTo = '/dashboard'
  try {
    const parsed = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    if (typeof parsed.returnTo === 'string' && parsed.returnTo.startsWith('/')) {
      returnTo = parsed.returnTo
    }
  } catch {
    // use default
  }

  try {
    // Exchange auth code for Google tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('[login/callback] token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=token_failed`)
    }

    const { id_token: googleIdToken } = await tokenRes.json()

    // Exchange Google ID token for Firebase ID token + refresh token
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: `id_token=${googleIdToken}&providerId=google.com`,
          requestUri: process.env.NEXT_PUBLIC_APP_URL,
          returnIdpCredential: true,
          returnSecureToken: true,
        }),
      }
    )

    if (!firebaseRes.ok) {
      console.error('[login/callback] firebase signInWithIdp failed:', await firebaseRes.text())
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=firebase_failed`)
    }

    const { idToken, refreshToken } = await firebaseRes.json()

    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Upsert host record
    const hostRef = adminDb.collection('hosts').doc(decoded.uid)
    const hostSnap = await hostRef.get()
    if (!hostSnap.exists) {
      await hostRef.set({
        uid: decoded.uid,
        email: decoded.email ?? '',
        name: decoded.name ?? decoded.email?.split('@')[0] ?? 'User',
        avatarUrl: decoded.picture ?? null,
        timezone: 'UTC',
        createdAt: new Date().toISOString(),
      })
    }

    // Set session + refresh cookies and redirect
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${returnTo}`)
    response.cookies.set('calroute-session', idToken, cookieOpts(SESSION_MAX_AGE))
    if (refreshToken) {
      response.cookies.set('calroute-refresh', refreshToken, cookieOpts(REFRESH_MAX_AGE))
    }
    response.cookies.delete('login_state')
    return response
  } catch (e) {
    console.error('[login/callback] error:', e)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`)
  }
}

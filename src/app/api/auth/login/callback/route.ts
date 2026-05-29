export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

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
      const err = await tokenRes.text()
      console.error('[login/callback] token exchange failed:', err)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=token_failed`)
    }

    const { id_token: googleIdToken } = await tokenRes.json()

    // Exchange Google ID token for Firebase ID token via Identity Toolkit
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
      const err = await firebaseRes.text()
      console.error('[login/callback] firebase signInWithIdp failed:', err)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=firebase_failed`)
    }

    const { idToken } = await firebaseRes.json()

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

    // Create a long-lived session cookie (14 days) from the short-lived ID token
    const expiresIn = 14 * 24 * 60 * 60 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    // Set session cookie and redirect
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${returnTo}`)
    response.cookies.set('calroute-session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'lax',
    })
    response.cookies.delete('login_state')
    return response
  } catch (e) {
    console.error('[login/callback] error:', e)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`)
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  const { idToken } = await request.json()

  // Step 1: verify the token
  let decoded: any
  try {
    decoded = await adminAuth.verifyIdToken(idToken)
  } catch (e) {
    console.error('[session] verifyIdToken failed:', e)
    return NextResponse.json({ error: 'Invalid token', step: 'verifyIdToken', detail: String(e) }, { status: 401 })
  }

  // Step 2: upsert host record
  try {
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
  } catch (e) {
    console.error('[session] Firestore failed:', e)
    return NextResponse.json({ error: 'Firestore error', step: 'firestore', detail: String(e) }, { status: 500 })
  }

  // Step 3: set cookie — store the raw ID token.
  // ID tokens expire in 1h, but the login page automatically refreshes
  // them via onAuthStateChanged when the cookie expires, so users stay
  // logged in without seeing a login prompt.
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.set('firebase-token', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1h — matches Firebase ID token lifetime
    path: '/',
    sameSite: 'lax',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.delete('firebase-token')
  response.cookies.delete('firebase-session') // clean up old cookie name
  return response
}

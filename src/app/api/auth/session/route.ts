export const dynamic = 'force-dynamic'

// Called from client after Firebase sign-in to set a server-side cookie
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  const { idToken } = await request.json()

  try {
    // Step 1: verify the token
    let decoded: any
    try {
      decoded = await adminAuth.verifyIdToken(idToken)
    } catch (e) {
      console.error('[session] verifyIdToken failed:', e)
      return NextResponse.json({ error: 'Invalid token', step: 'verifyIdToken', detail: String(e) }, { status: 401 })
    }

    // Step 2: read/write Firestore
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
      return NextResponse.json({ error: 'Invalid token', step: 'firestore', detail: String(e) }, { status: 401 })
    }

    // Create a long-lived session cookie (14 days) using Firebase Admin
    let sessionCookie: string
    try {
      const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 days in ms
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    } catch (e) {
      console.error('[session] createSessionCookie failed:', e)
      return NextResponse.json({ error: 'Invalid token', step: 'createSessionCookie', detail: String(e) }, { status: 401 })
    }

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set('firebase-session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 14, // 14 days
      path: '/',
      sameSite: 'lax',
    })
    return response
  } catch (error) {
    console.error('[session] unexpected error:', error)
    return NextResponse.json({ error: 'Invalid token', step: 'unknown', detail: String(error) }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.delete('firebase-token')
  return response
}

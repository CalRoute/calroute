// Called from client after Firebase sign-in to set a server-side cookie
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  const { idToken } = await request.json()

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)

    // Ensure host document exists in Firestore
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

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set('firebase-token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      sameSite: 'lax',
    })
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.delete('firebase-token')
  return response
}

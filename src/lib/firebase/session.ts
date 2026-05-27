// Server-side: verify Firebase session cookie
import { adminAuth } from './admin'
import { cookies } from 'next/headers'

export async function getServerUser() {
  const cookieStore = await cookies()
  // Support both the new long-lived session cookie and the old 1h token cookie
  const sessionCookie = cookieStore.get('firebase-session')?.value
  const legacyToken = cookieStore.get('firebase-token')?.value

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
      return decoded
    } catch {
      return null
    }
  }

  if (legacyToken) {
    try {
      const decoded = await adminAuth.verifyIdToken(legacyToken)
      return decoded
    } catch {
      return null
    }
  }

  return null
}

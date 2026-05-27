// Server-side: verify Firebase ID token from cookie
import { adminAuth } from './admin'
import { cookies } from 'next/headers'

export async function getServerUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) return null

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded
  } catch {
    return null
  }
}

export async function getServerUserOrNull() {
  return await getServerUser()
}

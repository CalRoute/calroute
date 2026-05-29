import { adminAuth } from './admin'
import { cookies } from 'next/headers'

export async function getServerUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) return null

  try {
    return await adminAuth.verifyIdToken(token)
  } catch {
    return null
  }
}

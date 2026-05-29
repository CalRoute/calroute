import { adminAuth } from './admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getServerUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('calroute-session')?.value
  if (!token) return null

  try {
    return await adminAuth.verifyIdToken(token)
  } catch {
    return null
  }
}

export async function requireUser(path: string) {
  const user = await getServerUser()
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(path)}`)
  return user
}

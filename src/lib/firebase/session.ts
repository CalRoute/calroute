import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/session-jwt'

export async function getServerUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('calroute-session')?.value
  if (!token) {
    console.log('[session] calroute-session cookie missing')
    return null
  }

  const payload = await verifySession(token)
  if (!payload) {
    console.log('[session] session token invalid or expired')
    return null
  }

  return { uid: payload.uid, email: payload.email }
}

export async function requireUser(path: string) {
  const user = await getServerUser()
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(path)}`)
  return user
}

import { adminAuth } from './admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getServerUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('calroute-session')?.value
  if (!token) {
    console.log('[session] calroute-session cookie missing')
    return null
  }

  try {
    return await adminAuth.verifyIdToken(token)
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string }
    console.error('[session] verifyIdToken failed — code:', err?.code, 'message:', err?.message, 'token prefix:', token.slice(0, 40))
    return null
  }
}

export async function requireUser(path: string) {
  const user = await getServerUser()
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(path)}`)
  return user
}

import { adminAuth } from './admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getServerUser() {
  const cookieStore = await cookies()
  const session = cookieStore.get('calroute-session')?.value
  if (!session) return null

  try {
    return await adminAuth.verifySessionCookie(session)
  } catch {
    return null
  }
}

// Use in server components: redirects to /login?returnTo=<current-path>
export async function requireUser(path: string) {
  const user = await getServerUser()
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(path)}`)
  return user
}

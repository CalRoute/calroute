import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface AdminSession {
  uid: string
  email: string
  totpVerified: boolean
}

function sessionSecret() {
  const key = process.env.ADMIN_SESSION_SECRET
  if (!key) throw new Error('ADMIN_SESSION_SECRET is not configured')
  return new TextEncoder().encode(key)
}

function totpSecret() {
  const key = process.env.ADMIN_SESSION_SECRET
  if (!key) throw new Error('ADMIN_SESSION_SECRET is not configured')
  return new TextEncoder().encode(key + ':totp')
}

const SESSION_MAX_AGE = 8 * 60 * 60 // 8 hours

export async function signAdminSession(uid: string, email: string): Promise<string> {
  return new SignJWT({ uid, email, totpVerified: false })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(sessionSecret())
}

export async function signTotpSession(uid: string, email: string): Promise<string> {
  return new SignJWT({ uid, email, totpVerified: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(totpSecret())
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    // Check full session first (post-TOTP)
    const fullToken = cookieStore.get('admin-session')?.value
    if (fullToken) {
      const { payload } = await jwtVerify(fullToken, totpSecret())
      if (payload.totpVerified && payload.uid && payload.email) {
        return { uid: payload.uid as string, email: payload.email as string, totpVerified: true }
      }
    }
    // Check pre-TOTP session (just logged in via Google)
    const preToken = cookieStore.get('admin-pre-session')?.value
    if (preToken) {
      const { payload } = await jwtVerify(preToken, sessionSecret())
      if (payload.uid && payload.email) {
        return { uid: payload.uid as string, email: payload.email as string, totpVerified: false }
      }
    }
    return null
  } catch {
    return null
  }
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/login')
  if (!session.totpVerified) redirect('/verify')
  return session
}

export function sessionCookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
    domain: process.env.NODE_ENV === 'production' ? 'admin.calroute.me' : undefined,
  }
}

export { SESSION_MAX_AGE }

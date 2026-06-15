import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getServerUser } from '@/lib/firebase/session'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') ?? []

// Use in API routes: returns { uid, email } or a 403 Response
export async function requireAdminApi(request: Request): Promise<{ uid: string; email: string } | Response> {
  const user = await getServerUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  if (!ADMIN_UIDS.includes(user.uid)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  const otpOk = await verifyAdminOtpFromRequest(request)
  if (!otpOk) return new Response(JSON.stringify({ error: 'Admin 2FA required' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  return user
}

function secret() {
  const key = process.env.SESSION_SECRET
  if (!key) throw new Error('SESSION_SECRET is not configured')
  return new TextEncoder().encode(key + ':admin-otp')
}

export async function verifyAdminOtp(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin-otp')?.value
    if (!token) return false
    const { payload } = await jwtVerify(token, secret())
    return payload.admin === true
  } catch {
    return false
  }
}

// For use in API routes that receive a Request object
export async function verifyAdminOtpFromRequest(request: Request): Promise<boolean> {
  try {
    const cookieHeader = request.headers.get('cookie') ?? ''
    const match = cookieHeader.match(/(?:^|;\s*)admin-otp=([^;]+)/)
    const token = match?.[1]
    if (!token) return false
    const { payload } = await jwtVerify(token, secret())
    return payload.admin === true
  } catch {
    return false
  }
}

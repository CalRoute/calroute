export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/firebase/session'
import { getTotpSecret, verifyTotpCode } from '@/lib/admin-totp'
import { SignJWT } from 'jose'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') ?? []
const COOKIE_MAX_AGE = 8 * 60 * 60 // 8 hours

function secret() {
  const key = process.env.SESSION_SECRET
  if (!key) throw new Error('SESSION_SECRET is not configured')
  return new TextEncoder().encode(key + ':admin-otp')
}

export async function POST(request: NextRequest) {
  const user = await requireUser('/dashboard/admin')
  if (!ADMIN_UIDS.includes(user.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { code } = await request.json()
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Code required' }, { status: 400 })
  }

  const totpSecret = await getTotpSecret()
  if (!totpSecret) {
    return NextResponse.json({ error: 'TOTP not configured' }, { status: 400 })
  }

  if (!verifyTotpCode(totpSecret, code.replace(/\s/g, ''))) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
  }

  // Issue a short-lived admin-otp JWT stored in a cookie
  const token = await new SignJWT({ uid: user.uid, admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret())

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin-otp', token, {
    httpOnly: true,
    secure: true,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  return response
}

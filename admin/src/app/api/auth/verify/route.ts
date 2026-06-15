export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession, signTotpSession, sessionCookieOpts, SESSION_MAX_AGE } from '@/lib/session'
import { getTotpSecret, createTotpSecret, getTotpUri, verifyTotpCode } from '@/lib/totp'
import QRCode from 'qrcode'

export async function GET() {
  // Return QR code data for setup
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let secret = await getTotpSecret()
  const isNew = !secret
  if (!secret) secret = await createTotpSecret()

  const uri = getTotpUri(secret, session.email)
  const qrDataUrl = await QRCode.toDataURL(uri)

  return NextResponse.json({ qrDataUrl, isNew, secret })
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const fullToken = await signTotpSession(session.uid, session.email)
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('admin-pre-session')
  response.cookies.set('admin-session', fullToken, sessionCookieOpts(SESSION_MAX_AGE))
  return response
}

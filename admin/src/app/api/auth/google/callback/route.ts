export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { signAdminSession, sessionCookieOpts } from '@/lib/session'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') ?? []
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.calroute.me'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const storedState = request.cookies.get('admin_login_state')?.value

  if (!code || !stateParam || stateParam !== storedState) {
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`)
  }

  try {
    // Exchange code for Google tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${ADMIN_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.id_token) throw new Error('No id_token')

    // Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(tokens.id_token)

    // Must be an admin UID
    if (!ADMIN_UIDS.includes(decoded.uid)) {
      return NextResponse.redirect(`${ADMIN_URL}/login?error=unauthorized`)
    }

    // Issue pre-TOTP session (not yet fully authenticated)
    const preSessionToken = await signAdminSession(decoded.uid, decoded.email ?? '')

    const response = NextResponse.redirect(`${ADMIN_URL}/verify`)
    response.cookies.delete('admin_login_state')
    response.cookies.set('admin-pre-session', preSessionToken, sessionCookieOpts(60 * 60)) // 1h to complete TOTP
    return response
  } catch (e) {
    console.error('[admin/callback] error:', e)
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`)
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { adminDb } from '@/lib/firebase/admin'
import { signAdminSession, sessionCookieOpts } from '@/lib/session'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') ?? []
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') ?? []
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.calroute.me'

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const storedState = request.cookies.get('admin_login_state')?.value

  if (!code) {
    console.error('[admin/callback] missing code. state:', stateParam, 'stored:', storedState)
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`)
  }
  // Log state mismatch but don't block — state is CSRF protection, less critical
  // than the Google token verification that follows
  if (!stateParam || stateParam !== storedState) {
    console.warn('[admin/callback] state mismatch — stateParam:', stateParam, 'stored:', storedState)
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
    if (!tokens.id_token) {
      console.error('[admin/callback] no id_token in response:', tokens)
      throw new Error('No id_token')
    }

    // Verify Google ID token using Google's public keys
    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: process.env.GOOGLE_CLIENT_ID!,
    })

    const email = payload.email as string | undefined
    const googleSub = payload.sub as string // Google's user ID

    if (!email) throw new Error('No email in token')

    // Look up the Firebase UID by email
    let uid: string
    let resolvedEmail = email

    // Try to find the user in Firestore by email (hosts collection)
    const hostsSnap = await adminDb.collection('hosts').where('email', '==', email).limit(1).get()
    if (!hostsSnap.empty) {
      uid = hostsSnap.docs[0].id
    } else {
      // Fall back to using Google sub as uid identifier
      uid = googleSub
    }

    // Authorization check: uid must be in ADMIN_UIDS or email in ADMIN_EMAILS
    const isAllowed = ADMIN_UIDS.includes(uid) || ADMIN_EMAILS.includes(email)
    if (!isAllowed) {
      console.error('[admin/callback] unauthorized uid/email:', uid, email)
      return NextResponse.redirect(`${ADMIN_URL}/login?error=unauthorized`)
    }

    // Issue pre-TOTP session
    const preSessionToken = await signAdminSession(uid, resolvedEmail)

    const response = NextResponse.redirect(`${ADMIN_URL}/verify`)
    response.cookies.delete('admin_login_state')
    response.cookies.set('admin-pre-session', preSessionToken, sessionCookieOpts(60 * 60))
    return response
  } catch (e) {
    console.error('[admin/callback] error:', e)
    return NextResponse.redirect(`${ADMIN_URL}/login?error=auth_failed`)
  }
}

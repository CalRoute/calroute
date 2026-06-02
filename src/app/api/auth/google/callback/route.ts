export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { createOAuthClient } from '@/lib/google/calendar'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('google_oauth_state')?.value
  const uid = request.cookies.get('google_oauth_uid')?.value

  if (!code || !state || state !== storedState || !uid) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=oauth_failed`
    )
  }

  try {
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Enforce 5-calendar limit
    const existingSnap = await adminDb
      .collection('hosts')
      .doc(uid)
      .collection('connected_calendars')
      .get()

    if (existingSnap.size >= 5) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=calendar_limit`
      )
    }

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Save to Firestore: hosts/{uid}/connected_calendars/{calendarId}
    const calRef = adminDb
      .collection('hosts')
      .doc(uid)
      .collection('connected_calendars')
      .doc(`google_${userInfo.email}_primary`)

    await calRef.set({
      provider: 'google',
      accountEmail: userInfo.email,
      calendarId: 'primary',
      label: 'Primary',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date!).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
    })

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=calendar_connected`
    )
    response.cookies.delete('google_oauth_state')
    response.cookies.delete('google_oauth_uid')
    return response
  } catch (error) {
    console.error('Calendar OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=oauth_failed`
    )
  }
}

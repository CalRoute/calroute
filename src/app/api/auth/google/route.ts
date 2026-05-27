export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { getAuthUrl } from '@/lib/google/calendar'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = crypto.randomBytes(16).toString('hex')
  const url = getAuthUrl(state)

  const response = NextResponse.redirect(url)
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })
  response.cookies.set('google_oauth_uid', user.uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  })

  return response
}

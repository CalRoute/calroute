export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  const allCookies = cookieStore.getAll().map(c => c.name)

  const result: any = {
    cookies_present: allCookies,
    has_firebase_token: !!token,
    token_preview: token ? token.slice(0, 20) + '...' : null,
  }

  if (token) {
    result.token_length = token.length
    result.token_parts = token.split('.').length
    try {
      const decoded = await adminAuth.verifyIdToken(token)
      result.token_valid = true
      result.uid = decoded.uid
      result.email = decoded.email
      result.expires = new Date(decoded.exp * 1000).toISOString()
      result.issued = new Date(decoded.iat * 1000).toISOString()
    } catch (e: any) {
      result.token_valid = false
      result.token_error = e?.message ?? String(e)
      // Try to decode header without verification to see what we got
      try {
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString())
        result.token_header = header
      } catch {
        result.token_header = 'unparseable'
      }
    }
  }

  return NextResponse.json(result)
}

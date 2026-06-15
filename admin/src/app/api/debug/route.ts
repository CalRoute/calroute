export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.FIREBASE_PRIVATE_KEY ?? ''
  return NextResponse.json({
    length: key.length,
    first30: key.slice(0, 30),
    last20: key.slice(-20),
    hasRealNewlines: key.includes('\n'),
    hasLiteralBackslashN: key.includes('\\n'),
    hasLeadingQuote: key.startsWith('"'),
    hasTrailingQuote: key.endsWith('"'),
    email: process.env.FIREBASE_CLIENT_EMAIL ?? 'missing',
    projectId: process.env.FIREBASE_PROJECT_ID ?? 'missing',
  })
}

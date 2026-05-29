export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    await adminAuth.verifyIdToken(token)
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 })
  }
}

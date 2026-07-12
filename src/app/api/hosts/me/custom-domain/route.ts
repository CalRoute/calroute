export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customDomain } = await request.json() as { customDomain: string | null }

  // Validate: must be a bare hostname (no protocol, no path)
  if (customDomain !== null) {
    const cleaned = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const hostRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$/
    if (!hostRegex.test(cleaned)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    // Make sure no other user already claimed this domain
    const existing = await adminDb
      .collection('hosts')
      .where('customDomain', '==', cleaned)
      .limit(1)
      .get()

    if (!existing.empty && existing.docs[0].id !== user.uid) {
      return NextResponse.json({ error: 'Domain already in use' }, { status: 409 })
    }

    await adminDb.collection('hosts').doc(user.uid).update({ customDomain: cleaned })
    return NextResponse.json({ customDomain: cleaned })
  }

  // null → remove the domain
  await adminDb.collection('hosts').doc(user.uid).update({ customDomain: null })
  return NextResponse.json({ customDomain: null })
}

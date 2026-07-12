export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { randomBytes } from 'crypto'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customDomain } = await request.json() as { customDomain: string | null }

  if (customDomain === null) {
    await adminDb.collection('hosts').doc(user.uid).update({
      customDomain: null,
      customDomainPending: null,
      customDomainToken: null,
    })
    return NextResponse.json({ customDomain: null })
  }

  const cleaned = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  const hostRegex = /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$/
  if (!hostRegex.test(cleaned)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  // Check no other verified user already owns this domain
  const existing = await adminDb
    .collection('hosts')
    .where('customDomain', '==', cleaned)
    .limit(1)
    .get()

  if (!existing.empty && existing.docs[0].id !== user.uid) {
    return NextResponse.json({ error: 'Domain already in use' }, { status: 409 })
  }

  // Generate a unique verification token
  const token = `calroute-verify=${randomBytes(16).toString('hex')}`

  await adminDb.collection('hosts').doc(user.uid).update({
    customDomainPending: cleaned,
    customDomainToken: token,
    // Clear any previously verified domain until this one is confirmed
    customDomain: null,
  })

  return NextResponse.json({ pending: cleaned, token })
}

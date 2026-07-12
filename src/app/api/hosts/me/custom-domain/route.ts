export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { removeVercelDomain } from '@/lib/vercel-domains'
import { randomBytes } from 'crypto'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { customDomain } = await request.json() as { customDomain: string | null }

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const currentActiveDomain = hostSnap.data()?.customDomain as string | null

  if (customDomain === null) {
    // Remove verified domain from Vercel
    if (currentActiveDomain) {
      await removeVercelDomain(currentActiveDomain).catch(e =>
        console.error('[custom-domain] vercel remove error:', e)
      )
    }
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

  // If the user is switching to a different domain, remove the old one from Vercel
  if (currentActiveDomain && currentActiveDomain !== cleaned) {
    await removeVercelDomain(currentActiveDomain).catch(e =>
      console.error('[custom-domain] vercel remove old domain error:', e)
    )
  }

  // Generate a unique verification token
  const token = `calroute-verify=${randomBytes(16).toString('hex')}`

  await adminDb.collection('hosts').doc(user.uid).update({
    customDomainPending: cleaned,
    customDomainToken: token,
    customDomain: null,
  })

  return NextResponse.json({ pending: cleaned, token })
}

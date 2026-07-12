export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { addVercelDomain } from '@/lib/vercel-domains'
import dns from 'dns/promises'

export async function GET(_request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()
  const pending = host?.customDomainPending as string | null
  const token = host?.customDomainToken as string | null

  if (!pending || !token) {
    return NextResponse.json({ error: 'No pending domain to verify' }, { status: 400 })
  }

  // Look for the TXT record on _calroute-verify.<domain> to avoid CNAME conflicts
  const verifyHost = `_calroute-verify.${pending}`
  let records: string[][] = []
  try {
    records = await dns.resolveTxt(verifyHost)
  } catch {
    return NextResponse.json({ verified: false, reason: 'DNS lookup failed — record may not exist yet' })
  }

  const flat = records.flat()
  const found = flat.includes(token)

  if (!found) {
    return NextResponse.json({ verified: false, reason: 'TXT record not found yet' })
  }

  // Register domain with Vercel so it gets SSL and routes traffic
  const { ok } = await addVercelDomain(pending)
  if (!ok) {
    return NextResponse.json(
      { verified: false, reason: 'Could not register domain with hosting provider' },
      { status: 502 }
    )
  }

  // Activate the domain on the host profile
  await adminDb.collection('hosts').doc(user.uid).update({
    customDomain: pending,
    customDomainPending: null,
    customDomainToken: null,
  })

  return NextResponse.json({ verified: true, customDomain: pending })
}

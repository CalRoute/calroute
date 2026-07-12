export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import dns from 'dns/promises'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const customDomain = hostSnap.data()?.customDomain as string | null

  if (!customDomain) {
    return NextResponse.json({ error: 'No custom domain set' }, { status: 400 })
  }

  try {
    const records = await dns.resolveCname(customDomain)
    const pointsToVercel = records.some(r =>
      r.includes('vercel') || r.includes('cname.vercel-dns.com')
    )
    return NextResponse.json({ connected: pointsToVercel, cname: records[0] ?? null })
  } catch {
    return NextResponse.json({ connected: false, cname: null })
  }
}

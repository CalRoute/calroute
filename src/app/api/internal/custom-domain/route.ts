export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// Internal-only: resolves a custom hostname to a booking slug.
// Called from proxy.ts, which cannot use Firebase Admin directly.
export async function GET(request: NextRequest) {
  const hostname = request.nextUrl.searchParams.get('hostname')
  if (!hostname) {
    return NextResponse.json({ error: 'Missing hostname' }, { status: 400 })
  }

  const hostSnap = await adminDb
    .collection('hosts')
    .where('customDomain', '==', hostname)
    .limit(1)
    .get()

  if (hostSnap.empty) {
    return NextResponse.json({ slug: null }, { status: 404 })
  }

  const uid = hostSnap.docs[0].id

  // Find the first active booking link for this host
  const linkSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', uid)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (linkSnap.empty) {
    return NextResponse.json({ slug: null }, { status: 404 })
  }

  return NextResponse.json({ slug: linkSnap.docs[0].data().slug })
}

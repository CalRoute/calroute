export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { hasSecret } from '@/lib/session-jwt'

export async function GET() {
  if (!hasSecret()) {
    return NextResponse.json({ error: 'SESSION_SECRET env var not set on this deployment' }, { status: 500 })
  }

  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Not logged in — session cookie missing or invalid' }, { status: 401 })

  // What collectionGroup finds for this uid
  const memberSnap = await adminDb
    .collectionGroup('hosts')
    .where('hostId', '==', user.uid)
    .get()

  const found = memberSnap.docs.map(d => ({
    path: d.ref.path,
    data: d.data(),
    parentId: d.ref.parent.parent?.id ?? null,
  }))

  // Also check top-level hosts doc
  const hostDoc = await adminDb.collection('hosts').doc(user.uid).get()

  return NextResponse.json({
    uid: user.uid,
    email: user.email,
    hostProfile: hostDoc.exists ? hostDoc.data() : null,
    collectionGroupResults: found,
    resultCount: found.length,
  })
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

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

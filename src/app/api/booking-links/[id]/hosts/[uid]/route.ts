export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

async function getAuthedOwner(linkId: string) {
  const user = await getServerUser()
  if (!user) return null
  const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
  if (!linkSnap.exists || linkSnap.data()?.ownerId !== user.uid) return null
  return user
}

// DELETE: remove a host from the booking link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const { id, uid } = await params
  const user = await getAuthedOwner(id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(uid).delete()

  return NextResponse.json({ success: true })
}

// PATCH: update a host's priority
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; uid: string }> }
) {
  const { id, uid } = await params
  const user = await getAuthedOwner(id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priority } = await request.json()
  if (typeof priority !== 'number') {
    return NextResponse.json({ error: 'priority must be a number' }, { status: 400 })
  }

  await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(uid).update({
      priority: Math.max(1, Math.min(10, Math.round(priority))),
    })

  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

async function verifyOwner(linkId: string) {
  const user = await getServerUser()
  if (!user) return null
  const snap = await adminDb.collection('booking_links').doc(linkId).get()
  if (!snap.exists || snap.data()?.ownerId !== user.uid) return null
  return { uid: user.uid, snap }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyOwner(id)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, teamName, description, slug,
    durationMinutes, bufferBeforeMinutes, bufferAfterMinutes,
    routingStrategy, maxDaysAhead,
  } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
  }

  // Check slug uniqueness (excluding current link)
  const existing = await adminDb
    .collection('booking_links')
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (!existing.empty && existing.docs[0].id !== id) {
    return NextResponse.json({ error: 'This slug is already taken. Try another.' }, { status: 409 })
  }

  await adminDb.collection('booking_links').doc(id).update({
    slug,
    title,
    teamName: teamName || null,
    description: description || null,
    durationMinutes: durationMinutes ?? 30,
    bufferBeforeMinutes: bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: bufferAfterMinutes ?? 0,
    routingStrategy: routingStrategy ?? 'priority',
    maxDaysAhead: maxDaysAhead ?? 30,
    updatedAt: new Date().toISOString(),
  })

  return NextResponse.json({ id, slug })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyOwner(id)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await adminDb.collection('booking_links').doc(id).delete()
  return NextResponse.json({ success: true })
}

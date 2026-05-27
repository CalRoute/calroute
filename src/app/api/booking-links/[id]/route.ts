import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

async function verifyOwner(request: NextRequest, linkId: string) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const snap = await adminDb.collection('booking_links').doc(linkId).get()
    if (!snap.exists || snap.data()?.ownerId !== decoded.uid) return null
    return { uid: decoded.uid, snap }
  } catch {
    return null
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyOwner(request, id)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, description, slug,
    durationMinutes, bufferBeforeMinutes, bufferAfterMinutes,
    routingStrategy, maxDaysAhead, availability,
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
    description: description || null,
    durationMinutes: durationMinutes ?? 30,
    bufferBeforeMinutes: bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: bufferAfterMinutes ?? 0,
    routingStrategy: routingStrategy ?? 'priority',
    maxDaysAhead: maxDaysAhead ?? 30,
    updatedAt: new Date().toISOString(),
  })

  // Update availability
  if (availability) {
    const batch = adminDb.batch()
    for (const a of availability) {
      const ref = adminDb
        .collection('hosts')
        .doc(auth.uid)
        .collection('availability')
        .doc(String(a.dayOfWeek))
      batch.set(ref, { dayOfWeek: a.dayOfWeek, startTime: a.startTime, endTime: a.endTime })
    }
    await batch.commit()
  }

  return NextResponse.json({ id, slug })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyOwner(request, id)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await adminDb.collection('booking_links').doc(id).delete()
  return NextResponse.json({ success: true })
}

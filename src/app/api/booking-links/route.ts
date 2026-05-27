export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  // Verify Firebase token
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = await request.json()
  const {
    title, description, slug,
    durationMinutes, bufferBeforeMinutes, bufferAfterMinutes,
    routingStrategy, maxDaysAhead, availability,
  } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
  }

  // Check slug is unique
  const existing = await adminDb
    .collection('booking_links')
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (!existing.empty) {
    return NextResponse.json({ error: 'This slug is already taken. Try another.' }, { status: 409 })
  }

  // Create booking link
  const linkRef = adminDb.collection('booking_links').doc()
  await linkRef.set({
    ownerId: uid,
    slug,
    title,
    description: description || null,
    durationMinutes: durationMinutes ?? 30,
    bufferBeforeMinutes: bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: bufferAfterMinutes ?? 0,
    routingStrategy: routingStrategy ?? 'priority',
    isActive: true,
    maxDaysAhead: maxDaysAhead ?? 30,
    createdAt: new Date().toISOString(),
  })

  // Add the creator as the first host on this link
  await linkRef.collection('hosts').doc(uid).set({
    hostId: uid,
    priority: 1,
    lastBookedAt: null,
  })

  // Save availability to host's subcollection
  const batch = adminDb.batch()
  for (const a of (availability ?? [])) {
    const ref = adminDb
      .collection('hosts')
      .doc(uid)
      .collection('availability')
      .doc(String(a.dayOfWeek))
    batch.set(ref, {
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })
  }
  await batch.commit()

  return NextResponse.json({ id: linkRef.id, slug })
}

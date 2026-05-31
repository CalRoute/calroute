export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = user.uid
  const body = await request.json()
  const {
    title, teamName, description, slug,
    durationMinutes, bufferBeforeMinutes, bufferAfterMinutes,
    routingStrategy, maxDaysAhead,
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
    teamName: teamName || null,
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

  return NextResponse.json({ id: linkRef.id, slug })
}

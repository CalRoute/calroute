export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { getUserBilling } from '@/lib/billing/get-user-billing'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const uid = user.uid
  const body = await request.json()
  const {
    title, teamName, description, slug,
    durationMinutes, bufferBeforeMinutes, bufferAfterMinutes,
    routingStrategy, maxDaysAhead, meetingType, meetingLocation,
  } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 })
  }

  // Enforce free tier: 1 booking link max
  const billing = await getUserBilling(uid)
  if (billing.isFree) {
    const existingLinks = await adminDb
      .collection('booking_links')
      .where('ownerId', '==', uid)
      .limit(1)
      .get()
    if (!existingLinks.empty) {
      return NextResponse.json(
        { error: 'Free plan is limited to 1 booking link. Upgrade to Solo to create unlimited links.' },
        { status: 403 }
      )
    }
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
    meetingType: meetingType ?? 'google_meet',
    meetingLocation: meetingLocation || null,
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

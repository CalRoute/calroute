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

// GET: list all hosts on a booking link with their profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hostsSnap = await adminDb
    .collection('booking_links').doc(id).collection('hosts').get()

  const hosts = await Promise.all(
    hostsSnap.docs.map(async (doc) => {
      const data = doc.data()
      const profileSnap = await adminDb.collection('hosts').doc(data.hostId).get()
      const profile = profileSnap.data()
      return {
        uid: data.hostId,
        priority: data.priority ?? 1,
        name: profile?.name ?? data.hostId,
        email: profile?.email ?? '',
        avatarUrl: profile?.avatarUrl ?? null,
      }
    })
  )

  return NextResponse.json({ hosts })
}

// POST: add a team member by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthedOwner(id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, priority = 1 } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  // Look up the user by email in the hosts collection
  const hostQuery = await adminDb
    .collection('hosts')
    .where('email', '==', email.toLowerCase().trim())
    .limit(1)
    .get()

  if (hostQuery.empty) {
    return NextResponse.json(
      { error: 'No CalRoute account found for that email. They need to sign in to CalRoute first.' },
      { status: 404 }
    )
  }

  const targetUid = hostQuery.docs[0].id

  // Check if already on the link
  const existing = await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(targetUid).get()
  if (existing.exists) {
    return NextResponse.json({ error: 'This person is already on this link.' }, { status: 409 })
  }

  await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(targetUid).set({
      hostId: targetUid,
      priority: Math.max(1, Math.min(10, Number(priority))),
      lastBookedAt: null,
    })

  const profile = hostQuery.docs[0].data()
  return NextResponse.json({
    uid: targetUid,
    priority,
    name: profile.name ?? email,
    email: profile.email ?? email,
    avatarUrl: profile.avatarUrl ?? null,
  })
}

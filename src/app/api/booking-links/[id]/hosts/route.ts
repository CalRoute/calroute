export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { syncTeamSeats } from '@/lib/billing/sync-team-seats'

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

  // Domain abuse prevention: max 2 external domains per team
  const adminDomain = user.email.split('@')[1]
  const inviteeDomain = email.split('@')[1]

  if (inviteeDomain !== adminDomain) {
    // Count distinct external domains on this link
    const hostsSnap = await adminDb
      .collection('booking_links').doc(id).collection('hosts').get()

    const externalDomains = new Set<string>()
    for (const hostDoc of hostsSnap.docs) {
      const hostId = hostDoc.data().hostId
      const hostProfileSnap = await adminDb.collection('hosts').doc(hostId).get()
      const hostEmail = hostProfileSnap.data()?.email
      if (hostEmail) {
        const domain = hostEmail.split('@')[1]
        if (domain !== adminDomain) {
          externalDomains.add(domain)
        }
      }
    }

    // Check if adding this new external domain would exceed limit
    if (!externalDomains.has(inviteeDomain) && externalDomains.size >= 2) {
      return NextResponse.json(
        { error: 'EXTERNAL_DOMAIN_LIMIT', message: 'Maximum of 2 external domains per team reached' },
        { status: 403 }
      )
    }
  }

  await adminDb
    .collection('booking_links').doc(id).collection('hosts').doc(targetUid).set({
      hostId: targetUid,
      priority: Math.max(1, Math.min(10, Number(priority))),
      lastBookedAt: null,
    })

  // Sync team seats if this is a multi-host link
  await syncTeamSeats(user.uid)

  const profile = hostQuery.docs[0].data()
  return NextResponse.json({
    uid: targetUid,
    priority,
    name: profile.name ?? email,
    email: profile.email ?? email,
    avatarUrl: profile.avatarUrl ?? null,
  })
}

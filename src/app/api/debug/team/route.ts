export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'
import { verifySession, hasSecret } from '@/lib/session-jwt'

export async function GET() {
  const result: any = {
    step: 'start',
    hasSecret: hasSecret(),
    sessionSecretLength: process.env.SESSION_SECRET?.length ?? 0,
  }

  try {
    result.step = 'reading cookie'
    const cookieStore = await cookies()
    const token = cookieStore.get('calroute-session')?.value
    result.hasCookie = !!token
    result.cookiePrefix = token ? token.slice(0, 30) + '...' : null

    if (!token) {
      result.step = 'no cookie'
      return NextResponse.json(result)
    }

    result.step = 'verifying session'
    const payload = await verifySession(token)
    result.sessionValid = !!payload
    result.uid = payload?.uid ?? null
    result.email = payload?.email ?? null

    if (!payload) {
      result.step = 'invalid session'
      return NextResponse.json(result)
    }

    result.step = 'querying owned links'
    const ownedSnap = await adminDb
      .collection('booking_links')
      .where('ownerId', '==', payload.uid)
      .orderBy('createdAt', 'desc')
      .get()
    result.ownedLinkCount = ownedSnap.size
    result.ownedLinks = ownedSnap.docs.map(d => ({ id: d.id, ownerId: d.data().ownerId, title: d.data().title }))

    result.step = 'querying member links'
    const memberSnap = await adminDb
      .collectionGroup('hosts')
      .where('hostId', '==', payload.uid)
      .get()
    result.memberCount = memberSnap.size

    result.step = 'resolving member links'
    const resolved = await Promise.all(
      memberSnap.docs.map(async (doc) => {
        const linkId = doc.ref.parent.parent?.id
        if (!linkId) return { linkId: null, reason: 'no parent' }
        const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
        if (!linkSnap.exists) return { linkId, reason: 'link not found' }
        const data = linkSnap.data()!
        return {
          linkId,
          title: data.title,
          ownerId: data.ownerId,
          isOwner: data.ownerId === payload.uid,
        }
      })
    )
    result.resolvedMembers = resolved

    result.step = 'done'
    return NextResponse.json(result)
  } catch (e: any) {
    result.error = e?.message ?? String(e)
    result.stack = e?.stack?.slice(0, 500)
    return NextResponse.json(result, { status: 500 })
  }
}

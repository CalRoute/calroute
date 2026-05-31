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

    result.step = 'querying firestore'
    const memberSnap = await adminDb
      .collectionGroup('hosts')
      .where('hostId', '==', payload.uid)
      .get()

    result.step = 'done'
    result.memberCount = memberSnap.size
    result.members = memberSnap.docs.map(d => ({
      path: d.ref.path,
      hostId: d.data().hostId,
      parentId: d.ref.parent.parent?.id ?? null,
    }))

    return NextResponse.json(result)
  } catch (e: any) {
    result.error = e?.message ?? String(e)
    result.stack = e?.stack?.slice(0, 500)
    return NextResponse.json(result, { status: 500 })
  }
}

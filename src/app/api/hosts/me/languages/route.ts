export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { languages } = await request.json()
  if (!Array.isArray(languages)) {
    return NextResponse.json({ error: 'languages must be an array' }, { status: 400 })
  }

  await adminDb.collection('hosts').doc(user.uid).update({ languages })
  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { timezone } = await request.json()
  if (!timezone || typeof timezone !== 'string') {
    return NextResponse.json({ error: 'timezone is required' }, { status: 400 })
  }

  await adminDb.collection('hosts').doc(user.uid).update({ timezone })
  return NextResponse.json({ success: true })
}

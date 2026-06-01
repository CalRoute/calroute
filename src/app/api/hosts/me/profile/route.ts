export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required and must be non-empty' }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be less than 100 characters' }, { status: 400 })
    }

    await adminDb.collection('hosts').doc(user.uid).update({
      name: name.trim(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[profile] error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

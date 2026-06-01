export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be boolean' }, { status: 400 })
    }

    await adminDb
      .collection('hosts').doc(user.uid)
      .collection('connected_calendars').doc(id)
      .update({ isActive })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[calendar patch] error:', error)
    return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await adminDb
    .collection('hosts').doc(user.uid)
    .collection('connected_calendars').doc(id)
    .delete()

  return NextResponse.json({ success: true })
}

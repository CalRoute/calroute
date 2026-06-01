export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { isActive } = await request.json() as { isActive?: boolean }

    const webhookDoc = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('webhooks')
      .doc(id)
      .get()

    if (!webhookDoc.exists) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    if (isActive !== undefined) {
      await webhookDoc.ref.update({ isActive })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[webhook-patch] error:', error)
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const webhookDoc = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('webhooks')
      .doc(id)
      .get()

    if (!webhookDoc.exists) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await webhookDoc.ref.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[webhook-delete] error:', error)
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}

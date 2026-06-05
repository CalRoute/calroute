export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

const ALLOWED_EVENTS = [
  'booking.confirmed',
  'booking.cancelled',
  'booking.rescheduled',
  'booking.transferred',
  'team.host_added',
  'team.host_removed',
  'subscription.confirmed',
  'subscription.payment_failed',
] as const

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
    const { isActive, url, events } = await request.json() as { isActive?: boolean; url?: string; events?: string[] }

    const webhookDoc = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('webhooks')
      .doc(id)
      .get()

    if (!webhookDoc.exists) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Validate URL if provided
    if (url !== undefined) {
      try {
        const urlObj = new URL(url)
        if (urlObj.protocol !== 'https:') {
          return NextResponse.json({ error: 'URL must use HTTPS' }, { status: 400 })
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
    }

    // Validate events if provided
    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: 'Events must be a non-empty array' }, { status: 400 })
      }
      const invalidEvents = events.filter(e => !ALLOWED_EVENTS.includes(e as any))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(', ')}` },
          { status: 400 }
        )
      }
    }

    const updates: Record<string, any> = {}
    if (isActive !== undefined) updates.isActive = isActive
    if (url !== undefined) updates.url = url
    if (events !== undefined) updates.events = events

    if (Object.keys(updates).length > 0) {
      await webhookDoc.ref.update(updates)
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

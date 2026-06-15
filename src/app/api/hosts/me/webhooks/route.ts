export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { getUserBilling } from '@/lib/billing/get-user-billing'
import crypto from 'crypto'

function generateRandomSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const webhooksSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('webhooks')
      .get()

    const webhooks = webhooksSnap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        url: data.url,
        events: data.events,
        isActive: data.isActive,
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('[webhooks] error:', error)
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { url, events } = await request.json() as { url: string; events: string[] }

    if (!url || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'URL and events are required' }, { status: 400 })
    }

    // Webhooks require a paid plan
    const billing = await getUserBilling(user.uid)
    if (billing.isFree) {
      return NextResponse.json(
        { error: 'Webhooks are available on the Solo and Team plans. Upgrade to access this feature.' },
        { status: 403 }
      )
    }

    // Check limit
    const webhooksSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('webhooks')
      .get()

    if (webhooksSnap.size >= 10) {
      return NextResponse.json({ error: 'Maximum 10 webhooks allowed' }, { status: 400 })
    }

    const secret = generateRandomSecret()
    const docId = `webhook_${Date.now()}`

    await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('webhooks')
      .doc(docId)
      .set({
        url,
        events,
        secret,
        isActive: true,
        createdAt: new Date().toISOString(),
      })

    return NextResponse.json({
      id: docId,
      secret,
    })
  } catch (error) {
    console.error('[webhooks-create] error:', error)
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import type { ExternalDataConfig } from '@/types/database'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const configSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('settings')
      .doc('external_data')
      .get()

    if (!configSnap.exists) {
      return NextResponse.json({ configured: false })
    }

    const config = configSnap.data() as ExternalDataConfig
    return NextResponse.json({
      configured: true,
      apiEndpoint: config.apiEndpoint,
      updatedAt: config.updatedAt,
    })
  } catch (error) {
    console.error('[external-data-config-get] error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { apiEndpoint, apiKey } = await request.json() as {
      apiEndpoint: string
      apiKey: string
    }

    if (!apiEndpoint || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate URL
    try {
      new URL(apiEndpoint)
    } catch {
      return NextResponse.json({ error: 'Invalid API endpoint URL' }, { status: 400 })
    }

    const now = new Date().toISOString()
    await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('settings')
      .doc('external_data')
      .set({
        apiEndpoint,
        apiKey,
        createdAt: now,
        updatedAt: now,
      } as ExternalDataConfig)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[external-data-config-put] error:', error)
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('settings')
      .doc('external_data')
      .delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[external-data-config-delete] error:', error)
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import type { ExternalDataConfig } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { hostId, queryParams } = await request.json() as {
      hostId: string
      queryParams: Record<string, string>
    }

    if (!hostId || !queryParams) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get external data config from the host
    const configSnap = await adminDb
      .collection('hosts')
      .doc(hostId)
      .collection('settings')
      .doc('external_data')
      .get()

    if (!configSnap.exists) {
      return NextResponse.json({ error: 'External data not configured' }, { status: 404 })
    }

    const config = configSnap.data() as ExternalDataConfig

    // Build query string from parameters
    const queryString = new URLSearchParams(queryParams).toString()
    const url = `${config.apiEndpoint}${config.apiEndpoint.includes('?') ? '&' : '?'}${queryString}`

    console.log('[external-data-lookup] fetching from:', config.apiEndpoint)

    // Call external API with the config's API key
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[external-data-lookup] api error:', response.status, errorText)
      return NextResponse.json(
        { error: `External API returned ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[external-data-lookup] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to lookup external data' },
      { status: 500 }
    )
  }
}

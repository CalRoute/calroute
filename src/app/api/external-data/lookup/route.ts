export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import type { ExternalDataConfig } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { linkId, queryParams } = await request.json() as {
      linkId: string
      queryParams: Record<string, string>
    }

    if (!linkId || !queryParams) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get external data config from the booking link
    const linkSnap = await adminDb
      .collection('booking_links')
      .doc(linkId)
      .get()

    if (!linkSnap.exists) {
      return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
    }

    const link = linkSnap.data() as any
    if (!link.externalDataEnabled || !link.externalDataApiEndpoint || !link.externalDataApiKey) {
      return NextResponse.json({ error: 'External data not configured for this link' }, { status: 404 })
    }

    const config = {
      apiEndpoint: link.externalDataApiEndpoint,
      apiKey: link.externalDataApiKey,
    }

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

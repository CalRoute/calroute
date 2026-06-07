export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { apiEndpoint, apiKey } = await request.json() as {
      apiEndpoint: string
      apiKey: string
    }

    if (!apiEndpoint || !apiKey) {
      return NextResponse.json({ error: 'Missing endpoint or key' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(apiEndpoint)
    } catch {
      return NextResponse.json({ error: 'Invalid API endpoint URL' }, { status: 400 })
    }

    // Test with sample query parameters
    const testUrl = new URL(apiEndpoint)
    testUrl.searchParams.set('test', 'true')
    testUrl.searchParams.set('email', 'test@example.com')

    console.log('[external-data-test] testing endpoint:', apiEndpoint)

    const response = await fetch(testUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    })

    // We don't care about the response body, just check if authentication worked
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: 'Invalid API credentials (authentication failed)' },
        { status: 401 }
      )
    }

    // 404 is ok (endpoint might not have test data)
    // 500 is ok (it's their server)
    // We just want to verify the endpoint exists and auth works
    if (!response.ok && response.status !== 404 && response.status !== 500) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: 'API credentials verified' })
  } catch (error) {
    console.error('[external-data-test] error:', error)
    const message = error instanceof Error ? error.message : 'Failed to test API'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

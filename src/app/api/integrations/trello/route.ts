export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import type { TrelloIntegration } from '@/types/database'

async function validateTrelloCredentials(apiKey: string, token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('[trello-validate] Response status:', response.status, text)
      return { valid: false, error: `Trello API returned ${response.status}` }
    }

    const data = await response.json()
    if (!data.id) {
      return { valid: false, error: 'Invalid Trello response' }
    }

    return { valid: true }
  } catch (err) {
    console.error('[trello-validate] Error:', err)
    return { valid: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const integrationSnap = await adminDb
      .collection('teams')
      .doc(user.uid)
      .collection('integrations')
      .doc('trello')
      .get()

    if (!integrationSnap.exists) {
      return NextResponse.json({ connected: false })
    }

    const integration = integrationSnap.data() as TrelloIntegration
    return NextResponse.json({
      connected: true,
      boardId: integration.boardId,
      boardName: integration.boardName,
      listId: integration.listId,
      listName: integration.listName,
      connectedAt: integration.connectedAt,
    })
  } catch (error) {
    console.error('[trello-get] error:', error)
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { apiKey, token, boardId, boardName, listId, listName } = await request.json() as {
      apiKey: string
      token: string
      boardId: string
      boardName: string
      listId: string
      listName: string
    }

    if (!apiKey || !token || !boardId || !listId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate credentials
    const validation = await validateTrelloCredentials(apiKey, token)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid Trello credentials' }, { status: 401 })
    }

    // Save integration
    await adminDb
      .collection('teams')
      .doc(user.uid)
      .collection('integrations')
      .doc('trello')
      .set({
        apiKey,
        token,
        boardId,
        boardName,
        listId,
        listName,
        connectedAt: new Date().toISOString(),
      } as TrelloIntegration)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[trello-post] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save integration' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await adminDb
      .collection('teams')
      .doc(user.uid)
      .collection('integrations')
      .doc('trello')
      .delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[trello-delete] error:', error)
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 })
  }
}

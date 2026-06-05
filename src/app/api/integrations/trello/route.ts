export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import type { TrelloIntegration } from '@/types/database'

async function validateTrelloCredentials(apiKey: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
    )
    return response.ok
  } catch {
    return false
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
    const isValid = await validateTrelloCredentials(apiKey, token)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid Trello credentials' }, { status: 401 })
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

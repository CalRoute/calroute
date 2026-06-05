export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const apiKey = searchParams.get('apiKey')
  const token = searchParams.get('token')

  if (!apiKey || !token) {
    return NextResponse.json({ error: 'Missing apiKey or token' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&lists=open`
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Trello boards' }, { status: 401 })
    }

    const boards = (await response.json()) as Array<{
      id: string
      name: string
      lists?: Array<{ id: string; name: string }>
    }>

    // Fetch lists for each board
    const boardsWithLists = await Promise.all(
      boards.map(async board => {
        let lists = board.lists || []
        if (lists.length === 0) {
          try {
            const listsResponse = await fetch(
              `https://api.trello.com/1/boards/${board.id}/lists?key=${apiKey}&token=${token}`
            )
            if (listsResponse.ok) {
              lists = await listsResponse.json()
            }
          } catch {
            // Silently skip if list fetch fails
          }
        }
        return {
          id: board.id,
          name: board.name,
          lists: lists.map((l: any) => ({ id: l.id, name: l.name })),
        }
      })
    )

    return NextResponse.json({ boards: boardsWithLists })
  } catch (error) {
    console.error('[trello-boards] error:', error)
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 })
  }
}

import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { disableUserAccount, enableUserAccount, deleteUserAccount } from '@/lib/account-management'

export async function POST(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid } = await params
  const { action, reason } = await request.json()

  try {
    let ok = false
    if (action === 'disable') {
      ok = await disableUserAccount(uid, reason || 'Disabled by admin')
    } else if (action === 'enable') {
      ok = await enableUserAccount(uid)
    } else if (action === 'delete') {
      ok = await deleteUserAccount(uid)
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!ok) return Response.json({ error: 'Action failed' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[accounts/action] error:', error)
    return Response.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}

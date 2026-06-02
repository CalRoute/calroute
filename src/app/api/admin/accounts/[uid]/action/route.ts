import { requireUser } from '@/lib/firebase/session'
import { disableUserAccount, enableUserAccount, deleteUserAccount } from '@/lib/account-management'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const user = await requireUser('/dashboard')
  const { uid } = await params

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { action, reason } = await request.json() as { action: 'disable' | 'enable' | 'delete'; reason?: string }

  try {
    let success = false

    switch (action) {
      case 'disable':
        success = await disableUserAccount(uid, reason || 'Admin action')
        break
      case 'enable':
        success = await enableUserAccount(uid)
        break
      case 'delete':
        success = await deleteUserAccount(uid)
        break
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!success) {
      return Response.json({ error: `Failed to ${action} account` }, { status: 500 })
    }

    return Response.json({ success: true, action })
  } catch (error) {
    console.error('[accounts] error:', error)
    return Response.json({ error: 'Failed to perform action' }, { status: 500 })
  }
}

import { requireUser } from '@/lib/firebase/session'
import { hasPermission, setUserRole } from '@/lib/user-roles'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const user = await requireUser('/dashboard')
  const { uid } = await params

  // Check if user is admin
  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user has permission
  const canManageUsers = await hasPermission(user.uid, 'manage_users')
  if (!canManageUsers) {
    return Response.json({ error: 'Permission denied' }, { status: 403 })
  }

  const { role } = await request.json() as { role: 'admin' | 'moderator' | 'user' }

  if (!['admin', 'moderator', 'user'].includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  try {
    await setUserRole(uid, role)
    return Response.json({ success: true })
  } catch (error) {
    console.error('[role] error:', error)
    return Response.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

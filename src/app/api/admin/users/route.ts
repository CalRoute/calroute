import { requireUser } from '@/lib/firebase/session'
import { getAllUsers, hasPermission } from '@/lib/user-roles'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const canManageUsers = await hasPermission(user.uid, 'manage_users')
  if (!canManageUsers) {
    return Response.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const users = await getAllUsers()
    return Response.json({ users })
  } catch (error) {
    console.error('[users] error:', error)
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

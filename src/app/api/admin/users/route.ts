import { requireAdminApi } from '@/lib/admin-session'
import { getAllUsers, hasPermission } from '@/lib/user-roles'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

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

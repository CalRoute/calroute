import { requireAdminApi } from '@/lib/admin-session'
import { hasPermission, setUserRole } from '@/lib/user-roles'


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck
  const { uid } = await params

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

import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { setUserRole, UserRole } from '@/lib/user-roles'

const VALID_ROLES: UserRole[] = ['admin', 'moderator', 'user']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid } = await params
  const { role } = await request.json()

  if (!VALID_ROLES.includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  try {
    const ok = await setUserRole(uid, role)
    if (!ok) return Response.json({ error: 'Failed to set role' }, { status: 500 })
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[users/role] error:', error)
    return Response.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

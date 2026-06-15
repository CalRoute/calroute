import { adminDb } from './firebase/admin'

export type UserRole = 'admin' | 'moderator' | 'user'
export type Permission = 'manage_users' | 'view_analytics' | 'manage_support' | 'view_webhooks' | 'manage_system'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ['manage_users', 'view_analytics', 'manage_support', 'view_webhooks', 'manage_system'],
  moderator: ['view_analytics', 'manage_support', 'view_webhooks'],
  user: ['view_analytics'],
}

export async function setUserRole(userId: string, role: UserRole) {
  try {
    await adminDb.collection('user_roles').doc(userId).set({
      role,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.error('[roles] error setting role:', error)
    return false
  }
}

export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const snap = await adminDb.collection('user_roles').doc(userId).get()
    return (snap.data()?.role || 'user') as UserRole
  } catch (error) {
    console.error('[roles] error getting role:', error)
    return 'user'
  }
}

export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const role = await getUserRole(userId)
  return ROLE_PERMISSIONS[role].includes(permission)
}

export async function getAllUsers() {
  try {
    const hostsSnap = await adminDb.collection('hosts').get()
    const rolesSnap = await adminDb.collection('user_roles').get()

    const roleMap = new Map(
      rolesSnap.docs.map(d => [d.id, d.data().role])
    )

    return hostsSnap.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      role: (roleMap.get(doc.id) || 'user') as UserRole,
      createdAt: doc.data().createdAt,
    }))
  } catch (error) {
    console.error('[roles] error getting all users:', error)
    return []
  }
}

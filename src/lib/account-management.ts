import { adminDb, adminAuth } from './firebase/admin'

export interface AccountStatus {
  uid: string
  email: string
  name: string
  status: 'active' | 'disabled' | 'deleted'
  disabledAt?: string
  disabledReason?: string
}

export async function disableUserAccount(userId: string, reason: string) {
  try {
    // Disable auth user
    await adminAuth.updateUser(userId, { disabled: true })

    // Mark in database
    await adminDb.collection('user_accounts').doc(userId).set({
      uid: userId,
      status: 'disabled',
      disabledAt: new Date().toISOString(),
      disabledReason: reason,
    })

    return true
  } catch (error) {
    console.error('[account] error disabling user:', error)
    return false
  }
}

export async function enableUserAccount(userId: string) {
  try {
    await adminAuth.updateUser(userId, { disabled: false })
    await adminDb.collection('user_accounts').doc(userId).update({
      status: 'active',
    })
    return true
  } catch (error) {
    console.error('[account] error enabling user:', error)
    return false
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    // Delete auth user
    await adminAuth.deleteUser(userId)

    // Mark as deleted
    await adminDb.collection('user_accounts').doc(userId).set({
      uid: userId,
      status: 'deleted',
      deletedAt: new Date().toISOString(),
    })

    // Delete user data
    await adminDb.collection('hosts').doc(userId).delete()
    return true
  } catch (error) {
    console.error('[account] error deleting user:', error)
    return false
  }
}

export async function getAccountStatuses() {
  try {
    const snap = await adminDb.collection('user_accounts').get()
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as (AccountStatus & { id: string })[]
  } catch (error) {
    console.error('[account] error getting statuses:', error)
    return []
  }
}

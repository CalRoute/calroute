import { requireUser } from '@/lib/firebase/session'
import { getAccountStatuses, disableUserAccount, enableUserAccount, deleteUserAccount } from '@/lib/account-management'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const statuses = await getAccountStatuses()
    return Response.json({ statuses })
  } catch (error) {
    console.error('[accounts] error:', error)
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

import { getAdminSession } from '@/lib/session'
import { getAccountStatuses, disableUserAccount, enableUserAccount, deleteUserAccount } from '@/lib/account-management'


export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

  try {
    const statuses = await getAccountStatuses()
    return Response.json({ statuses })
  } catch (error) {
    console.error('[accounts] error:', error)
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

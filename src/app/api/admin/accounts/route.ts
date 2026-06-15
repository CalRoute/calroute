import { requireAdminApi } from '@/lib/admin-session'
import { getAccountStatuses, disableUserAccount, enableUserAccount, deleteUserAccount } from '@/lib/account-management'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

  try {
    const statuses = await getAccountStatuses()
    return Response.json({ statuses })
  } catch (error) {
    console.error('[accounts] error:', error)
    return Response.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

import { requireUser } from '@/lib/firebase/session'
import { getAllBrandingConfigs } from '@/lib/custom-branding'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const configs = await getAllBrandingConfigs()
    return Response.json({ configs })
  } catch (error) {
    console.error('[branding] error:', error)
    return Response.json({ error: 'Failed to fetch branding configs' }, { status: 500 })
  }
}

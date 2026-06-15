import { requireAdminApi } from '@/lib/admin-session'
import { getAllBrandingConfigs } from '@/lib/custom-branding'


export async function GET(request: Request) {
  const adminCheck = await requireAdminApi(request)
  if (adminCheck instanceof Response) return adminCheck
  const user = adminCheck

  try {
    const configs = await getAllBrandingConfigs()
    return Response.json({ configs })
  } catch (error) {
    console.error('[branding] error:', error)
    return Response.json({ error: 'Failed to fetch branding configs' }, { status: 500 })
  }
}

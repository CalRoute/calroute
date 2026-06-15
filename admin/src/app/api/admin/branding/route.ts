import { getAdminSession } from '@/lib/session'
import { getAllBrandingConfigs } from '@/lib/custom-branding'


export async function GET(request: Request) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const user = { uid: session.uid, email: session.email }

  try {
    const configs = await getAllBrandingConfigs()
    return Response.json({ configs })
  } catch (error) {
    console.error('[branding] error:', error)
    return Response.json({ error: 'Failed to fetch branding configs' }, { status: 500 })
  }
}

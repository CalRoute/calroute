export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/session'

export default async function RootPage() {
  const session = await getAdminSession()
  if (!session) redirect('/login')
  if (!session.totpVerified) redirect('/verify')
  redirect('/dashboard')
}

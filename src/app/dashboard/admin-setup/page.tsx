export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/firebase/session'
import { getTotpSecret } from '@/lib/admin-totp'
import AdminSetupClient from './AdminSetupClient'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') ?? []

export default async function AdminSetupPage() {
  const user = await requireUser('/dashboard/admin-setup')
  if (!ADMIN_UIDS.includes(user.uid)) redirect('/dashboard')

  // Already set up — go straight to verify
  const hasSecret = !!(await getTotpSecret())
  if (hasSecret) redirect('/dashboard/admin-verify')

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#0D7377] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-6 3h.008v.008H6.75V15z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Set up admin 2FA</h1>
          <p className="text-gray-400 text-sm mt-2">Scan the QR code with Google Authenticator, 1Password, or any TOTP app</p>
        </div>
        <AdminSetupClient userEmail={user.email} />
      </div>
    </div>
  )
}

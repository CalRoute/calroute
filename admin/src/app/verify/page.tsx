export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/session'
import { getTotpSecret } from '@/lib/totp'
import VerifyClient from './VerifyClient'

export default async function VerifyPage() {
  const session = await getAdminSession()
  if (!session) redirect('/login')
  if (session.totpVerified) redirect('/dashboard')

  const hasSecret = !!(await getTotpSecret())

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#0D7377] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.126-.556-4.123-1.532-5.862A12 12 0 0112 2.714z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {hasSecret ? 'Two-factor auth' : 'Set up 2FA'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {hasSecret
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Scan the QR code with your authenticator app to continue'}
          </p>
        </div>
        <VerifyClient isSetup={!hasSecret} />
      </div>
    </div>
  )
}

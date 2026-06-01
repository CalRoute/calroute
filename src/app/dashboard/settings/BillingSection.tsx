'use client'

import { useToast } from '@/components/Toast'

interface Props {
  linkCount: number
}

export default function BillingSection({ linkCount }: Props) {
  const { showToast } = useToast()
  const linkLimit = 5
  const usagePercent = Math.round((linkCount / linkLimit) * 100)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Billing & Plan</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your subscription and usage limits.
        </p>
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-medium text-gray-900">Free Plan</p>
              <p className="text-xs text-gray-500 mt-0.5">Up to 5 booking links, unlimited bookings</p>
            </div>
            <button
              onClick={() => showToast('Upgrade feature coming soon', 'info')}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#0D7377] hover:bg-[#0a5f63] rounded-lg transition-colors whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">Booking Links</p>
            <p className="text-sm text-gray-500">
              {linkCount} / {linkLimit}
            </p>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercent >= 80 ? 'bg-red-500' : 'bg-teal-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {linkCount >= linkLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-900">
              You&apos;ve reached the limit for your plan. Upgrade to create more links.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import type { UserBillingDoc, TeamBillingDoc } from '@/types/billing'

interface Props {
  linkCount: number
}

interface BillingStatus {
  user: UserBillingDoc | null
  team: TeamBillingDoc | null
}

export default function BillingSection({ linkCount }: Props) {
  const { showToast } = useToast()
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [coupon, setCoupon] = useState('')

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await fetch('/api/billing/status')
        if (!res.ok) throw new Error('Failed to fetch billing status')
        const data = await res.json()
        setBilling(data)
      } catch (err) {
        console.error('Error fetching billing:', err)
        setBilling({ user: null, team: null })
      } finally {
        setLoading(false)
      }
    }

    fetchBilling()
  }, [])

  const handleCheckout = async (plan: 'solo' | 'team') => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, ...(coupon && { coupon }) }),
      })

      if (!res.ok) {
        const data = await res.json()
        showToast(data.error || 'Checkout failed', 'error')
        return
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      console.error('Error initiating checkout:', err)
      showToast('Failed to start checkout', 'error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const handlePortal = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })

      if (!res.ok) {
        showToast('Failed to open billing portal', 'error')
        return
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      console.error('Error opening portal:', err)
      showToast('Failed to open billing portal', 'error')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        <p className="text-sm text-gray-500">Loading billing information...</p>
      </div>
    )
  }

  const tier = billing?.user?.tier ?? 'free_trial'
  const status = billing?.user?.status ?? 'active'
  const isVip = tier === 'vip'
  const isSubscribed = ['solo', 'team_member'].includes(tier)
  const isPastDue = status === 'past_due'

  const planName =
    tier === 'solo'
      ? 'Solo Plan'
      : tier === 'team_member'
        ? 'Team Member'
        : tier === 'vip'
          ? '⭐ VIP'
          : 'Free Trial'

  const planDescription =
    tier === 'solo'
      ? '$10/month flat rate'
      : tier === 'team_member'
        ? 'Team-managed (Solo with 50% discount)'
        : tier === 'vip'
          ? 'Full access — complimentary'
          : 'Limited to personal use'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Billing & Plan</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your subscription and usage.
        </p>
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{planName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{planDescription}</p>
              {isPastDue && (
                <p className="text-xs text-red-600 font-medium mt-1">⚠️ Payment past due</p>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {isVip ? null : isSubscribed ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handlePortal}
                    disabled={checkoutLoading}
                    className="px-3 py-1.5 text-xs font-medium text-[#0D7377] bg-[#0D7377]/10 hover:bg-[#0D7377]/20 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Loading...' : 'Manage billing & invoices'}
                  </button>
                  <button
                    onClick={handlePortal}
                    disabled={checkoutLoading}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Loading...' : 'Cancel subscription'}
                  </button>
                </div>
              ) : isVip ? null : (
                <>
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Coupon code (optional)"
                    disabled={checkoutLoading}
                    className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:ring-offset-0 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  <button
                    onClick={() => handleCheckout('solo')}
                    disabled={checkoutLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#0D7377] hover:bg-[#0a5f63] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Loading...' : 'Get Solo Plan'}
                  </button>
                  <button
                    onClick={() => handleCheckout('team')}
                    disabled={checkoutLoading}
                    className="px-3 py-1.5 text-xs font-medium text-[#0D7377] border border-[#0D7377] hover:bg-[#0D7377]/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Loading...' : 'Get Team Plan'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Booking Links Usage */}
        {tier === 'free_trial' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Booking Links (Free trial)</p>
              <p className="text-sm text-gray-500">{linkCount} (unlimited after upgrade)</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                Upgrade to Solo or Team plan to unlock unlimited booking links.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

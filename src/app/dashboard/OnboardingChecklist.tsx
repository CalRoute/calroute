'use client'

import Link from 'next/link'

interface Props {
  hasCalendar: boolean
  hasLink: boolean
}

export default function OnboardingChecklist({ hasCalendar, hasLink }: Props) {
  const steps = [
    {
      number: 1,
      title: 'Connect your Google Calendar',
      description: 'So CalRoute knows when you\'re free',
      href: '/dashboard/settings?tab=calendars',
      done: hasCalendar,
    },
    {
      number: 2,
      title: 'Create your first booking link',
      description: 'Set your availability and meeting type',
      href: '/dashboard/links/new',
      done: hasLink,
    },
    {
      number: 3,
      title: 'Share your link',
      description: 'Send it to clients or embed it on your site',
      href: '/dashboard/links',
      done: false,
    },
  ]

  const completedCount = steps.filter(s => s.done).length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900 text-base">Get started with CalRoute</h2>
            <p className="text-sm text-gray-500 mt-0.5">Complete these steps to start accepting bookings</p>
          </div>
          <span className="text-xs font-medium text-[#0D7377] bg-[#0D7377]/10 rounded-full px-2.5 py-1 whitespace-nowrap">
            {completedCount}/3 done
          </span>
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0D7377] rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {steps.map((step) => (
          <Link
            key={step.number}
            href={step.href}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${
              step.done ? 'opacity-60' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold transition-colors ${
              step.done
                ? 'bg-[#0D7377] text-white'
                : 'bg-gray-100 text-gray-500 group-hover:bg-[#0D7377]/10 group-hover:text-[#0D7377]'
            }`}>
              {step.done ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : step.number}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
            </div>
            {!step.done && (
              <svg className="w-4 h-4 text-gray-300 group-hover:text-[#0D7377] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

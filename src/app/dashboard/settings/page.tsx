export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'
import type { ConnectedCalendar } from '@/types/database'
import DisconnectCalendarButton from './DisconnectCalendarButton'
import AvailabilityEditor from './AvailabilityEditor'
import LanguageEditor from './LanguageEditor'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const user = await requireUser('/dashboard/settings')

  const params = await searchParams

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  const availSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('availability')
    .get()

  const savedAvailability = availSnap.docs.map(d => d.data())
  const savedLanguages: string[] = host?.languages ?? []

  const calsSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('connected_calendars')
    .get()

  const calendars = calsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as ConnectedCalendar[]

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/dashboard/team" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Team
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Settings</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">

        {params.success === 'calendar_connected' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            ✅ Google Calendar connected successfully.
          </div>
        )}
        {params.error === 'oauth_failed' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            ❌ Could not connect Google Calendar. Please try again.
          </div>
        )}
        {params.error === 'calendar_limit' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            ⚠️ You&apos;ve reached the 5-calendar limit. Remove one before adding another.
          </div>
        )}

        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Profile</h2>
          <div className="text-sm text-gray-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">Name</span>
              <span>{host?.name ?? '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">Email</span>
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 w-16 flex-shrink-0">Timezone</span>
              <span>{host?.timezone ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Your availability</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              The hours you&apos;re available to take bookings. Applies to all links where you&apos;re a host.
            </p>
          </div>
          <AvailabilityEditor savedAvailability={savedAvailability} />
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Meeting languages</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Which languages can you hold meetings in? Applies to all links where you&apos;re a host.
            </p>
          </div>
          <LanguageEditor savedLanguages={savedLanguages} />
        </div>

        {/* Connected calendars */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Connected calendars</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                CalRoute checks these to find when you&apos;re free.
              </p>
            </div>
            <a
              href="/api/auth/google"
              className="inline-flex items-center justify-center gap-1.5 bg-[#0D7377] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0a5f63] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              + Connect Google Calendar
            </a>
          </div>

          {calendars.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">No calendars connected yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Connect a Google Calendar so CalRoute knows your real availability.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendars.map(cal => (
                <div
                  key={cal.id}
                  className="flex items-center justify-between gap-3 p-4 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-[#0D7377]/10 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      📅
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{cal.accountEmail}</p>
                      <p className="text-xs text-gray-500 truncate">{cal.label ?? cal.calendarId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:inline-flex ${cal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cal.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <DisconnectCalendarButton calendarId={cal.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}

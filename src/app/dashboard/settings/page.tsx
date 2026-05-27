import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'
import type { ConnectedCalendar } from '@/types/database'
import DisconnectCalendarButton from './DisconnectCalendarButton'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

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
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Settings</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Profile</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium text-gray-700">Name:</span> {host?.name ?? '—'}</p>
            <p><span className="font-medium text-gray-700">Email:</span> {user.email}</p>
            <p><span className="font-medium text-gray-700">Timezone:</span> {host?.timezone ?? '—'}</p>
          </div>
        </div>

        {/* Connected calendars */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Connected calendars</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                CalRoute checks these to find when you&apos;re free.
              </p>
            </div>
            <a
              href="/api/auth/google"
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
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
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                      📅
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cal.accountEmail}</p>
                      <p className="text-xs text-gray-500">{cal.label ?? cal.calendarId} · Google Calendar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cal.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <DisconnectCalendarButton calendarId={cal.id} hostId={user.uid} />
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

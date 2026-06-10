export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import type { ConnectedCalendar } from '@/types/database'
import DashboardLayout from '@/components/DashboardLayout'
import ProfileEditor from './ProfileEditor'
import NotificationPrefs from './NotificationPrefs'
import CalendarRow from './CalendarRow'
import AvailabilityEditor from './AvailabilityEditor'
import LanguageEditor from './LanguageEditor'
import TimezoneSelector from './TimezoneSelector'
import BillingSection from './BillingSection'
import ApiKeysSection from './ApiKeysSection'
import VacationDatesEditor from './VacationDatesEditor'
import SettingsTabs from './SettingsTabs'

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
    .collection('hosts').doc(user.uid).collection('availability').get()
  const savedAvailability = availSnap.docs.map(d => d.data())
  const savedLanguages: string[] = host?.languages ?? []
  const savedNotificationPrefs = host?.notificationPrefs ?? {
    emailOnNewBooking: true,
    emailOnCancellation: true,
    emailOnReschedule: true,
  }

  const calsSnap = await adminDb
    .collection('hosts').doc(user.uid).collection('connected_calendars').get()
  const calendars = calsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ConnectedCalendar[]

  const linksSnap = await adminDb
    .collection('booking_links').where('ownerId', '==', user.uid).get()
  const linkCount = linksSnap.size

  const apiKeysSnap = await adminDb
    .collection('hosts').doc(user.uid).collection('api_keys').get()
  const apiKeys = apiKeysSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

  const blackoutDatesSnap = await adminDb
    .collection('hosts').doc(user.uid).collection('blackout_dates')
    .orderBy('startDate', 'desc').get()
  const blackoutDates = blackoutDatesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
    >
      {params.success === 'calendar_connected' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          ✅ Google Calendar connected successfully.
        </div>
      )}
      {params.error === 'oauth_failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ❌ Could not connect Google Calendar. Please try again.
        </div>
      )}
      {params.error === 'calendar_limit' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
          ⚠️ You&apos;ve reached the 5-calendar limit. Remove one before adding another.
        </div>
      )}

      <SettingsTabs>
        {{
          profile: (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                <h2 className="font-semibold text-gray-900 text-lg">Profile</h2>
                <ProfileEditor savedName={host?.name ?? ''} email={user.email} />
                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-sm font-medium text-gray-900 mb-3">Timezone</label>
                  <TimezoneSelector savedTimezone={host?.timezone ?? 'UTC'} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Notification preferences</h2>
                  <p className="text-sm text-gray-500 mt-1">Control which events trigger email notifications.</p>
                </div>
                <NotificationPrefs savedPrefs={savedNotificationPrefs} />
              </div>
            </>
          ),
          availability: (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Weekly availability</h2>
                  <p className="text-sm text-gray-500 mt-1">Hours you&apos;re available to take bookings. Applies to all links where you&apos;re a host.</p>
                </div>
                <AvailabilityEditor savedAvailability={savedAvailability} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Vacation & blackout dates</h2>
                  <p className="text-sm text-gray-500 mt-1">Guests won&apos;t be able to book during these periods.</p>
                </div>
                <VacationDatesEditor savedDates={blackoutDates} />
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Meeting languages</h2>
                  <p className="text-sm text-gray-500 mt-1">Languages you can hold meetings in. Used to route bookings on team links.</p>
                </div>
                <LanguageEditor savedLanguages={savedLanguages} />
              </div>
            </>
          ),
          integrations: (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">Connected calendars</h2>
                  <p className="text-sm text-gray-500 mt-1">CalRoute checks these to find when you&apos;re free.</p>
                </div>
                <a
                  href="/api/auth/google"
                  className="inline-flex items-center justify-center gap-1.5 bg-[#0D7377] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#0a5f63] transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  + Connect Google Calendar
                </a>
              </div>
              {calendars.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-sm text-gray-500">No calendars connected yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Connect a Google Calendar so CalRoute knows your real availability.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calendars.map(cal => <CalendarRow key={cal.id} cal={cal} />)}
                </div>
              )}
            </div>
          ),
          billing: (
            <>
              <BillingSection linkCount={linkCount} />
              <ApiKeysSection apiKeys={apiKeys} />
            </>
          ),
        }}
      </SettingsTabs>
    </DashboardLayout>
  )
}

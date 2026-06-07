export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'
import type { ConnectedCalendar } from '@/types/database'
import DashboardLayout from '@/components/DashboardLayout'
import ProfileEditor from './ProfileEditor'
import NotificationPrefs from './NotificationPrefs'
import CalendarRow from './CalendarRow'
import AvailabilityEditor from './AvailabilityEditor'
import LanguageEditor from './LanguageEditor'
import TimezoneSelector from './TimezoneSelector'
import BookingLinksSection from './BookingLinksSection'
import BillingSection from './BillingSection'
import ApiKeysSection from './ApiKeysSection'
import VacationDatesEditor from './VacationDatesEditor'
import ExternalDataSection from './ExternalDataSection'

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
  const savedNotificationPrefs = host?.notificationPrefs ?? {
    emailOnNewBooking: true,
    emailOnCancellation: true,
    emailOnReschedule: true,
  }

  const calsSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('connected_calendars')
    .get()

  const calendars = calsSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as ConnectedCalendar[]

  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const links = linksSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[]

  const apiKeysSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('api_keys')
    .get()

  const apiKeys = apiKeysSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[]

  const externalDataSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('settings')
    .doc('external_data')
    .get()

  const externalDataConfig = externalDataSnap.exists
    ? {
        configured: true,
        apiEndpoint: externalDataSnap.data()?.apiEndpoint,
        updatedAt: externalDataSnap.data()?.updatedAt,
      }
    : { configured: false }

  const blackoutDatesSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('blackout_dates')
    .orderBy('startDate', 'desc')
    .get()

  const blackoutDates = blackoutDatesSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[]

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
    >
      <div className="space-y-4 sm:space-y-6">

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

        {/* Intro Card */}
        <div className="bg-[#0D7377]/5 border border-[#0D7377]/20 rounded-xl p-4 sm:p-5">
          <p className="text-sm text-[#0D7377]">
            Manage your profile, availability, integrations, and billing all in one place.
          </p>
        </div>

        {/* Core Settings Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">Core Settings</h3>
            <div className="space-y-4 sm:space-y-6">
              {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-6">
          <h2 className="font-semibold text-gray-900">Profile</h2>
          <ProfileEditor savedName={host?.name ?? ''} email={user.email} />
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">Timezone</label>
            <TimezoneSelector savedTimezone={host?.timezone ?? 'UTC'} />
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

        {/* Vacation & Blackout Dates */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Vacation & blackout dates</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Dates when you&apos;re unavailable. Guests won&apos;t be able to book during these periods.
            </p>
          </div>
          <VacationDatesEditor savedDates={blackoutDates} />
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Meeting languages</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Languages you can hold meetings in. Used to route bookings on team links.
            </p>
          </div>
          <LanguageEditor savedLanguages={savedLanguages} />
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Notification preferences</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Control which booking events trigger email notifications.
            </p>
          </div>
          <NotificationPrefs savedPrefs={savedNotificationPrefs} />
        </div>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">Integrations</h3>
            <div className="space-y-4 sm:space-y-6">
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
            <div className="space-y-3">
              {calendars.map(cal => (
                <CalendarRow key={cal.id} cal={cal} />
              ))}
            </div>
          )}
        </div>

              {/* External Data Integration */}
              <ExternalDataSection initialConfig={externalDataConfig} />
            </div>
          </div>
        </div>

        {/* Advanced Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-3">Advanced</h3>
            <div className="space-y-4 sm:space-y-6">
              {/* Booking Links */}
              <BookingLinksSection links={links} />

              {/* Billing */}
              <BillingSection linkCount={links.length} />

              {/* API Keys */}
              <ApiKeysSection apiKeys={apiKeys} />
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

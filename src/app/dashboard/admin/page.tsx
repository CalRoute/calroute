export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import DashboardLayout from '@/components/DashboardLayout'
import AdminMetrics from './AdminMetrics'
import UserSearch from './UserSearch'

// Admin UIDs - add your UID here
const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export default async function AdminPage() {
  const user = await requireUser('/dashboard')

  // Check if user is admin
  if (!ADMIN_UIDS.includes(user.uid)) {
    redirect('/dashboard')
  }

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  // Fetch metrics
  const hostsSnap = await adminDb.collection('hosts').get()
  const totalUsers = hostsSnap.size

  const bookingsSnap = await adminDb.collection('bookings').get()
  const totalBookings = bookingsSnap.size

  const confirmedBookings = bookingsSnap.docs.filter(d => d.data().status === 'confirmed').length
  const cancelledBookings = bookingsSnap.docs.filter(d => d.data().status === 'cancelled').length

  const linksSnap = await adminDb.collection('booking_links').get()
  const totalLinks = linksSnap.size

  // Active users (users with at least one booking in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentBookingsSnap = await adminDb
    .collection('bookings')
    .where('startTime', '>=', thirtyDaysAgo.toISOString())
    .get()

  const activeUserIds = new Set(recentBookingsSnap.docs.map(d => d.data().hostId))
  const activeUsers = activeUserIds.size

  // Phone vs video bookings
  const phoneCallBookings = bookingsSnap.docs.filter(d => {
    // Check if booking has customerPhone (indicates phone call meeting)
    return d.data().customerPhone !== null && d.data().customerPhone !== undefined
  }).length

  // Webhook usage
  const webhooksSnap = await adminDb.collectionGroup('webhooks').get()
  const totalWebhooks = webhooksSnap.size
  const usersWithWebhooks = new Set(webhooksSnap.docs.map(d => d.ref.parent.parent?.id)).size

  // API key usage
  const apiKeysSnap = await adminDb.collectionGroup('api_keys').get()
  const totalApiKeys = apiKeysSnap.size
  const usersWithApiKeys = new Set(apiKeysSnap.docs.map(d => d.ref.parent.parent?.id)).size

  const metrics = {
    totalUsers,
    activeUsers,
    totalLinks,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    phoneCallBookings,
    videoCallBookings: confirmedBookings - phoneCallBookings,
    cancelRate: confirmedBookings > 0 ? ((cancelledBookings / (confirmedBookings + cancelledBookings)) * 100).toFixed(1) : '0',
    totalWebhooks,
    usersWithWebhooks,
    totalApiKeys,
    usersWithApiKeys,
  }

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Admin' }]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and user management</p>
        </div>

        <AdminMetrics metrics={metrics} />

        <UserSearch />
      </div>
    </DashboardLayout>
  )
}

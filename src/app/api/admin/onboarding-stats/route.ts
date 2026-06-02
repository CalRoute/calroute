import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') || ['at6jDLmcVdQFOxaX1oJq6gU4ANf1']

export async function GET(request: Request) {
  const user = await requireUser('/dashboard')

  if (!ADMIN_UIDS.includes(user.uid)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Get all hosts
    const hostsSnap = await adminDb.collection('hosts').get()
    const totalUsers = hostsSnap.size

    if (totalUsers === 0) {
      return Response.json({
        totalStarted: 0,
        completed: 0,
        skipped: 0,
        completionRate: '0',
        averageTimeToComplete: '0s',
      })
    }

    // Track onboarding metrics
    let profileSetupCount = 0
    let calendarConnectedCount = 0
    let bookingLinkCreatedCount = 0
    let firstBookingCount = 0
    let completedCount = 0
    let skippedCount = 0
    const completionTimes: number[] = []

    // Check each user's onboarding progress
    await Promise.all(
      hostsSnap.docs.map(async (hostDoc) => {
        const hostId = hostDoc.id
        const hostData = hostDoc.data()

        // Check profile setup
        if (hostData.name && hostData.email) {
          profileSetupCount++
        }

        // Check calendar connected
        const calendarsSnap = await adminDb
          .collection('hosts')
          .doc(hostId)
          .collection('connected_calendars')
          .get()

        if (calendarsSnap.size > 0) {
          calendarConnectedCount++
        }

        // Check booking link created
        const linksSnap = await adminDb
          .collection('booking_links')
          .where('ownerId', '==', hostId)
          .get()

        if (linksSnap.size > 0) {
          bookingLinkCreatedCount++
        }

        // Check first booking
        const bookingsSnap = await adminDb
          .collection('bookings')
          .where('hostId', '==', hostId)
          .where('status', '==', 'confirmed')
          .limit(1)
          .get()

        if (bookingsSnap.size > 0) {
          firstBookingCount++

          // Calculate time to first booking
          const createdAt = hostData.createdAt ? new Date(hostData.createdAt).getTime() : 0
          const firstBookingTime = new Date(bookingsSnap.docs[0].data().startTime).getTime()
          if (createdAt > 0 && firstBookingTime > createdAt) {
            completionTimes.push(firstBookingTime - createdAt)
          }
        }

        // Check onboarding completion/skip status in user profile
        if (hostData.onboardingCompleted) {
          completedCount++
        } else if (hostData.onboardingSkipped) {
          skippedCount++
        }
      })
    )

    // If we don't have explicit completed count, infer from first booking
    const inferredCompleted = completedCount > 0 ? completedCount : firstBookingCount
    const inferredSkipped = skippedCount > 0 ? skippedCount : totalUsers - inferredCompleted

    // Calculate completion rate
    const completionRate = totalUsers > 0 ? ((inferredCompleted / totalUsers) * 100).toFixed(1) : '0'

    // Calculate average time to complete
    let averageTimeToComplete = '0s'
    if (completionTimes.length > 0) {
      const avgMs = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      const avgDays = Math.floor(avgMs / (1000 * 60 * 60 * 24))
      const avgHours = Math.floor((avgMs / (1000 * 60 * 60)) % 24)
      const avgMinutes = Math.floor((avgMs / (1000 * 60)) % 60)

      if (avgDays > 0) {
        averageTimeToComplete = `${avgDays}d ${avgHours}h`
      } else if (avgHours > 0) {
        averageTimeToComplete = `${avgHours}h ${avgMinutes}m`
      } else {
        averageTimeToComplete = `${avgMinutes}m`
      }
    }

    return Response.json({
      totalStarted: totalUsers,
      completed: inferredCompleted,
      inProgress: totalUsers - inferredCompleted - inferredSkipped,
      skipped: inferredSkipped,
      profileSetupRate: totalUsers > 0 ? ((profileSetupCount / totalUsers) * 100).toFixed(0) : '0',
      calendarConnectedRate: totalUsers > 0 ? ((calendarConnectedCount / totalUsers) * 100).toFixed(0) : '0',
      bookingLinkCreatedRate: totalUsers > 0 ? ((bookingLinkCreatedCount / totalUsers) * 100).toFixed(0) : '0',
      firstBookingRate: totalUsers > 0 ? ((firstBookingCount / totalUsers) * 100).toFixed(0) : '0',
      completionRate,
      averageTimeToComplete,
    })
  } catch (error) {
    console.error('[admin] onboarding stats error:', error)
    return Response.json({ error: 'Failed to load onboarding stats' }, { status: 500 })
  }
}

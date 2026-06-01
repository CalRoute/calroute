export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { emailOnNewBooking, emailOnCancellation, emailOnReschedule } = body

    if (
      typeof emailOnNewBooking !== 'boolean' ||
      typeof emailOnCancellation !== 'boolean' ||
      typeof emailOnReschedule !== 'boolean'
    ) {
      return NextResponse.json({ error: 'All notification preferences must be boolean' }, { status: 400 })
    }

    await adminDb.collection('hosts').doc(user.uid).update({
      notificationPrefs: {
        emailOnNewBooking,
        emailOnCancellation,
        emailOnReschedule,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[notifications] error:', error)
    return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 })
  }
}

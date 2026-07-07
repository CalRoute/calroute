export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { Resend } from 'resend'
import { vacationSetEmail } from '@/lib/email-templates/vacation-set'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const datesSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('blackout_dates')
      .get()

    const dates = datesSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }))

    return NextResponse.json({ dates })
  } catch (error) {
    console.error('[blackout-dates] error:', error)
    return NextResponse.json({ error: 'Failed to fetch dates' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dates } = await request.json() as {
      dates: Array<{ id?: string; startDate: string; endDate: string; reason?: string }>
    }

    if (!Array.isArray(dates)) {
      return NextResponse.json({ error: 'Dates array is required' }, { status: 400 })
    }

    // Delete all existing dates
    const existing = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('blackout_dates')
      .get()

    for (const doc of existing.docs) {
      await doc.ref.delete()
    }

    // Create new dates
    for (const date of dates) {
      const docId = date.id?.startsWith('temp_') || !date.id ? `bd_${Date.now()}_${Math.random()}` : date.id
      await adminDb
        .collection('hosts')
        .doc(user.uid)
        .collection('blackout_dates')
        .doc(docId as string)
        .set({
          startDate: date.startDate,
          endDate: date.endDate,
          reason: date.reason || null,
        })
    }

    // Send confirmation email if dates were added (fire-and-forget)
    if (dates.length > 0 && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
      const host = hostSnap.data()
      if (host?.email) {
        resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: host.email,
          subject: 'Your blackout dates have been saved',
          html: vacationSetEmail({
            name: host.name ?? 'there',
            dates,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        }).catch(e => console.error('[vacation-email] failed:', e))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[blackout-dates-put] error:', error)
    return NextResponse.json({ error: 'Failed to save dates' }, { status: 500 })
  }
}

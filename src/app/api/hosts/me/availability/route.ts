export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'

// PUT: replace the caller's entire availability schedule
export async function PUT(request: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { availability } = await request.json()
  if (!Array.isArray(availability)) {
    return NextResponse.json({ error: 'availability must be an array' }, { status: 400 })
  }

  const batch = adminDb.batch()

  for (const a of availability) {
    const ref = adminDb
      .collection('hosts').doc(user.uid)
      .collection('availability').doc(String(a.dayOfWeek))
    batch.set(ref, {
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })
  }

  // Delete days not in the submitted list
  const existingSnap = await adminDb
    .collection('hosts').doc(user.uid).collection('availability').get()
  const submittedDays = new Set(availability.map((a: any) => String(a.dayOfWeek)))
  existingSnap.docs.forEach(doc => {
    if (!submittedDays.has(doc.id)) batch.delete(doc.ref)
  })

  await batch.commit()
  return NextResponse.json({ success: true })
}

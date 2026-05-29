export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

async function getUid(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

// PUT: replace the caller's entire availability schedule
export async function PUT(request: NextRequest) {
  const uid = await getUid(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { availability } = await request.json()
  if (!Array.isArray(availability)) {
    return NextResponse.json({ error: 'availability must be an array' }, { status: 400 })
  }

  const batch = adminDb.batch()

  // Overwrite all days
  for (const a of availability) {
    const ref = adminDb
      .collection('hosts').doc(uid)
      .collection('availability').doc(String(a.dayOfWeek))
    batch.set(ref, {
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })
  }

  // Delete days that are now disabled (not in the submitted list)
  const existingSnap = await adminDb
    .collection('hosts').doc(uid).collection('availability').get()
  const submittedDays = new Set(availability.map((a: any) => String(a.dayOfWeek)))
  existingSnap.docs.forEach(doc => {
    if (!submittedDays.has(doc.id)) batch.delete(doc.ref)
  })

  await batch.commit()
  return NextResponse.json({ success: true })
}

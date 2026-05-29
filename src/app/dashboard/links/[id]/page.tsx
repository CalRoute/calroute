export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { redirect } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import EditBookingLinkForm from './EditBookingLinkForm'

export default async function EditBookingLinkPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser(`/dashboard/links/${id}`)

  const linkSnap = await adminDb.collection('booking_links').doc(id).get()
  if (!linkSnap.exists || linkSnap.data()?.ownerId !== user.uid) {
    redirect('/dashboard')
  }

  const link = { id: linkSnap.id, ...linkSnap.data() } as any

  // Load host's current availability
  const availSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('availability')
    .get()

  const savedAvailability = availSnap.docs.map(d => d.data())

  return <EditBookingLinkForm link={link} savedAvailability={savedAvailability} />
}

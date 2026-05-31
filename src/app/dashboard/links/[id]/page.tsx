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

  const hostsSnap = await adminDb.collection('booking_links').doc(id).collection('hosts').get()

  const initialHosts = await Promise.all(
    hostsSnap.docs.map(async (doc) => {
      const data = doc.data()
      const profileSnap = await adminDb.collection('hosts').doc(data.hostId).get()
      const profile = profileSnap.data()
      return {
        uid: data.hostId,
        priority: data.priority ?? 1,
        name: profile?.name ?? data.hostId,
        email: profile?.email ?? '',
        avatarUrl: profile?.avatarUrl ?? null,
      }
    })
  )

  return (
    <EditBookingLinkForm
      link={link}
      initialHosts={initialHosts}
      ownerId={user.uid}
    />
  )
}

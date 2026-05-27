import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import BookingWidget from '@/components/booking/BookingWidget'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EmbedPage({ params }: Props) {
  const { slug } = await params

  const snap = await adminDb
    .collection('booking_links')
    .where('slug', '==', slug)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (snap.empty) notFound()

  const link = { id: snap.docs[0].id, ...snap.docs[0].data() } as any

  const normalisedLink = {
    id: link.id,
    slug: link.slug,
    title: link.title,
    description: link.description ?? null,
    durationMinutes: link.durationMinutes ?? 30,
    bufferBeforeMinutes: link.bufferBeforeMinutes ?? 0,
    bufferAfterMinutes: link.bufferAfterMinutes ?? 0,
    routingStrategy: link.routingStrategy ?? 'priority',
    isActive: link.isActive,
    maxDaysAhead: link.maxDaysAhead ?? 30,
    ownerId: link.ownerId,
    createdAt: link.createdAt,
  }

  return (
    <div className="p-4">
      <BookingWidget link={normalisedLink} />
    </div>
  )
}

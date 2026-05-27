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
    duration_minutes: link.durationMinutes,
    buffer_before_minutes: link.bufferBeforeMinutes ?? 0,
    buffer_after_minutes: link.bufferAfterMinutes ?? 0,
    routing_strategy: link.routingStrategy ?? 'priority',
    is_active: link.isActive,
    max_days_ahead: link.maxDaysAhead ?? 30,
    owner_id: link.ownerId,
    created_at: link.createdAt,
  }

  return (
    <div className="p-4">
      <BookingWidget link={normalisedLink} />
    </div>
  )
}

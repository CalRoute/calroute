import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { adminDb } from '@/lib/firebase/admin'
import BookingWidget from '@/components/booking/BookingWidget'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const snap = await adminDb
    .collection('booking_links')
    .where('slug', '==', slug)
    .where('isActive', '==', true)
    .limit(1)
    .get()

  if (snap.empty) return { title: 'Not Found' }
  const link = snap.docs[0].data()

  return {
    title: `Book a time — ${link.title}`,
    description: link.description ?? 'Schedule a meeting via CalRoute',
  }
}

export default async function BookPage({ params }: Props) {
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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Suspense fallback={<div className="text-center py-12">Loading availability…</div>}>
          <BookingWidget link={normalisedLink} />
        </Suspense>
      </div>
    </main>
  )
}

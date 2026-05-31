export const dynamic = 'force-dynamic'

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

  // Language picker only makes sense for team links (2+ hosts)
  const hostsSnap = await adminDb
    .collection('booking_links').doc(link.id).collection('hosts').get()

  let availableLanguages: string[] = []
  if (hostsSnap.docs.length > 1) {
    const hostLanguages = await Promise.all(
      hostsSnap.docs.map(async (hDoc) => {
        const hostSnap = await adminDb.collection('hosts').doc(hDoc.data().hostId).get()
        return (hostSnap.data()?.languages ?? []) as string[]
      })
    )
    availableLanguages = [...new Set(hostLanguages.flat())]
  }

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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Suspense fallback={<div className="text-center py-12">Loading availability…</div>}>
          <BookingWidget link={normalisedLink} availableLanguages={availableLanguages} />
        </Suspense>
      </div>
    </main>
  )
}

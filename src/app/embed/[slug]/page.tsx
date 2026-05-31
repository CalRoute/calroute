export const dynamic = 'force-dynamic'

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

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{link.title}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: transparent;
          }
          body {
            padding: 16px;
          }
        ` }} />
      </head>
      <body>
        <BookingWidget link={normalisedLink} availableLanguages={availableLanguages} />
      </body>
    </html>
  )
}

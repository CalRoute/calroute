import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import BookingWidget from '@/components/booking/BookingWidget'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createServiceClient()
  const { data: link } = await supabase
    .from('booking_links')
    .select('title, description')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!link) return { title: 'Not Found' }

  return {
    title: `Book a time — ${link.title}`,
    description: link.description ?? `Schedule a meeting via CalRoute`,
  }
}

export default async function BookPage({ params }: Props) {
  const supabase = await createServiceClient()
  const { data: link } = await supabase
    .from('booking_links')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!link) notFound()

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Suspense fallback={<div className="text-center py-12">Loading availability…</div>}>
          <BookingWidget link={link} />
        </Suspense>
      </div>
    </main>
  )
}

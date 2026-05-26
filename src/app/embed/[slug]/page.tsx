import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import BookingWidget from '@/components/booking/BookingWidget'

interface Props {
  params: { slug: string }
}

export default async function EmbedPage({ params }: Props) {
  const supabase = await createServiceClient()
  const { data: link } = await supabase
    .from('booking_links')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!link) notFound()

  return (
    <div className="p-4">
      <BookingWidget link={link} />
    </div>
  )
}

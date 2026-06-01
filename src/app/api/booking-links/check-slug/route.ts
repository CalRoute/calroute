import { adminDb } from '@/lib/firebase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return Response.json({ error: 'slug required' }, { status: 400 })
  }

  try {
    const existing = await adminDb
      .collection('booking_links')
      .where('slug', '==', slug)
      .limit(1)
      .get()

    const isAvailable = existing.empty

    if (isAvailable) {
      return Response.json({ available: true, slug })
    }

    // Generate alternatives
    const alternatives: string[] = []
    for (let i = 2; i <= 5; i++) {
      const candidate = `${slug}-${i}`
      const check = await adminDb
        .collection('booking_links')
        .where('slug', '==', candidate)
        .limit(1)
        .get()
      if (check.empty) {
        alternatives.push(candidate)
      }
    }

    return Response.json({
      available: false,
      slug,
      alternatives,
    })
  } catch (error) {
    console.error('Error checking slug:', error)
    return Response.json({ error: 'Failed to check slug' }, { status: 500 })
  }
}

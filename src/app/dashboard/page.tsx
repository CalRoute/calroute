import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getServerUser()
  if (!user) redirect('/login')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const links = linksSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">CalRoute</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</Link>
          <Link href="/api/auth/signout" className="text-sm text-gray-600 hover:text-gray-900">Sign out</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {host?.name ?? 'there'} 👋
          </h2>
          <Link
            href="/dashboard/links/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New booking link
          </Link>
        </div>

        {links.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No booking links yet.</p>
            <Link href="/dashboard/links/new" className="text-blue-600 hover:underline text-sm font-medium">
              Create your first link →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{link.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {link.durationMinutes} min · {link.routingStrategy} routing
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    /book/{link.slug}
                  </a>
                  <Link
                    href={`/dashboard/links/${link.id}`}
                    className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export const dynamic = 'force-dynamic'

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
    <main className="min-h-screen bg-[#F7F4EF]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 flex-shrink-0">CalRoute</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Settings
          </Link>
          <Link
            href="/api/auth/signout"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block"
          >
            Sign out
          </Link>
          <Link
            href="/dashboard/links/new"
            className="bg-[#0D7377] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-[#0a5f63] transition-colors whitespace-nowrap"
          >
            + New link
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Welcome back, {host?.name ?? 'there'} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your booking links below.</p>
        </div>

        {links.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-500 mb-4 text-sm">No booking links yet.</p>
            <Link
              href="/dashboard/links/new"
              className="inline-flex items-center gap-1 bg-[#0D7377] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors"
            >
              Create your first link →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{link.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {link.durationMinutes} min · {link.routingStrategy === 'round_robin' ? 'Round robin' : 'Priority'} routing
                    </p>
                    <a
                      href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0D7377] hover:underline mt-1 block truncate"
                    >
                      /book/{link.slug}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sign out on mobile (hidden in nav) */}
        <div className="sm:hidden mt-8 text-center">
          <Link href="/api/auth/signout" className="text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </Link>
        </div>
      </div>
    </main>
  )
}

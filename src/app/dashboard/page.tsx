export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  // Links I own — with team member count
  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const links = await Promise.all(
    linksSnap.docs.map(async (d) => {
      const hostsSnap = await adminDb
        .collection('booking_links').doc(d.id).collection('hosts').get()

      const members = await Promise.all(
        hostsSnap.docs.map(async (hDoc) => {
          const hData = hDoc.data()
          const profileSnap = await adminDb.collection('hosts').doc(hData.hostId).get()
          const profile = profileSnap.data()
          return {
            uid: hData.hostId,
            name: profile?.name ?? hData.hostId,
            avatarUrl: profile?.avatarUrl ?? null,
          }
        })
      )

      return { id: d.id, ...d.data(), members } as any
    })
  )

  // Links I'm a team member on (but don't own)
  let teamLinks: any[] = []
  try {
    const memberSnap = await adminDb
      .collectionGroup('hosts')
      .where('hostId', '==', user.uid)
      .get()

    teamLinks = (
      await Promise.all(
        memberSnap.docs.map(async (doc) => {
          const linkId = doc.ref.parent.parent?.id
          if (!linkId) return null
          const linkSnap = await adminDb.collection('booking_links').doc(linkId).get()
          if (!linkSnap.exists) return null
          const data = linkSnap.data()!
          if (data.ownerId === user.uid) return null
          const ownerSnap = await adminDb.collection('hosts').doc(data.ownerId).get()
          return {
            id: linkSnap.id,
            ...data,
            ownerName: ownerSnap.data()?.name ?? data.ownerId,
          }
        })
      )
    ).filter(Boolean) as any[]
  } catch (e) {
    console.error('[dashboard] collectionGroup query failed:', e)
  }

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <DashboardLayout user={{ email: user.email }}>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Manage your booking links</h2>
          <Link
            href="/dashboard/links/new"
            className="bg-[#0D7377] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium hover:bg-[#0a5f63] transition-colors whitespace-nowrap"
          >
            + New link
          </Link>
        </div>

        {/* My links */}
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My booking links</h3>
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

                      {/* Team member avatars */}
                      {link.members.length > 0 && (
                        <div className="flex items-center gap-2 mt-2.5">
                          <div className="flex -space-x-1.5">
                            {link.members.slice(0, 5).map((m: any) => (
                              <div
                                key={m.uid}
                                title={m.name}
                                className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold overflow-hidden flex-shrink-0"
                              >
                                {m.avatarUrl
                                  ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                  : initials(m.name)}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">
                            {link.members.length === 1
                              ? '1 host'
                              : `${link.members.length} hosts`}
                          </span>
                        </div>
                      )}
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
        </section>

        {/* Team links — links I'm a host on but don't own */}
        {teamLinks.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Team links I host</h3>
            <div className="space-y-3">
              {teamLinks.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{link.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {link.durationMinutes} min · managed by {link.ownerName}
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
                    <span className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                      Host
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Set your availability in{' '}
              <Link href="/dashboard/settings" className="underline hover:text-gray-600">Settings</Link>{' '}
              so bookings route to you correctly.
            </p>
          </section>
        )}

        {/* Sign out on mobile */}
        <div className="sm:hidden text-center">
          <Link href="/api/auth/signout" className="text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

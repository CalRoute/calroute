export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return (
    <div
      title={name}
      className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0"
    >
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        : initials(name)}
    </div>
  )
}

export default async function TeamPage() {
  const user = await requireUser('/dashboard/team')

  // Links I own — with their host members
  const linksSnap = await adminDb
    .collection('booking_links')
    .where('ownerId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get()

  const ownedLinks = await Promise.all(
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
            email: profile?.email ?? '',
            avatarUrl: profile?.avatarUrl ?? null,
            priority: hData.priority ?? 1,
          }
        })
      )

      return { id: d.id, ...d.data(), members } as any
    })
  )

  // Links I'm a host on (but don't own)
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
          const ownerProfile = ownerSnap.data()
          return {
            id: linkSnap.id,
            ...data,
            ownerName: ownerProfile?.name ?? data.ownerId,
            ownerAvatarUrl: ownerProfile?.avatarUrl ?? null,
            ownerEmail: ownerProfile?.email ?? '',
          }
        })
      )
    ).filter(Boolean) as any[]
  } catch (e) {
    console.error('[team] collectionGroup query failed:', e)
  }

  const hasAnything = ownedLinks.some(l => l.members.length > 0) || teamLinks.length > 0

  return (
    <main className="min-h-screen bg-[#F7F4EF]">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Dashboard
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Team</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">

        {/* Links I own that have team members */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Your link teams</h2>

          {ownedLinks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">You don&apos;t own any booking links yet.</p>
              <Link
                href="/dashboard/links/new"
                className="inline-flex mt-3 items-center gap-1 bg-[#0D7377] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors"
              >
                Create a link →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ownedLinks.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{link.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {link.routingStrategy === 'round_robin' ? 'Round robin' : 'Priority'} routing · {link.durationMinutes} min
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                    >
                      Manage team
                    </Link>
                  </div>

                  {link.members.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No team members yet — add hosts from the link settings.</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {link.members.map((m: any) => (
                        <div key={m.uid} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          <Avatar name={m.name} avatarUrl={m.avatarUrl} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                            <p className="text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                          {link.routingStrategy === 'priority' && (
                            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5 flex-shrink-0">
                              Priority {m.priority}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Teams I'm part of */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Teams you&apos;re part of</h2>

          {teamLinks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">You haven&apos;t been added to anyone&apos;s team yet.</p>
              <p className="text-xs text-gray-400 mt-1">When someone adds you as a host to their booking link, it will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamLinks.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={link.ownerName} avatarUrl={link.ownerAvatarUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                      <p className="text-xs text-gray-400">Managed by {link.ownerName}</p>
                    </div>
                    <span className="text-xs text-[#0D7377] bg-[#0D7377]/10 rounded-full px-2.5 py-1 flex-shrink-0">
                      Host
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                    <a
                      href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0D7377] hover:underline truncate"
                    >
                      /book/{link.slug}
                    </a>
                    <Link
                      href="/dashboard/settings"
                      className="text-xs text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
                    >
                      Set your availability →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {!hasAnything && (
          <p className="text-center text-xs text-gray-400">
            Team features let multiple people share a single booking link.{' '}
            <Link href="/dashboard/links/new" className="underline hover:text-gray-600">Create a link</Link>{' '}
            and add hosts to get started.
          </p>
        )}
      </div>
    </main>
  )
}

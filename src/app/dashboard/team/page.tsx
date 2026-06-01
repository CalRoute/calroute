export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import InvitePanel from './InvitePanel'

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name, avatarUrl, size = 8 }: { name: string; avatarUrl: string | null; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full border-2 border-white bg-[#0D7377]/10 text-[#0D7377] flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0`
  return (
    <div title={name} className={cls}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        : initials(name)}
    </div>
  )
}

function StatusDot({ hasAvailability, hasCalendar }: { hasAvailability: boolean; hasCalendar: boolean }) {
  if (hasAvailability && hasCalendar) {
    return <div className="w-2.5 h-2.5 rounded-full bg-green-500" title="Setup complete" />
  }
  return <div className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Incomplete setup" />
}

export default async function TeamPage() {
  const user = await requireUser('/dashboard/team')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

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

          const availSnap = await adminDb
            .collection('hosts').doc(hData.hostId)
            .collection('availability').limit(1).get()
          const hasAvailability = !availSnap.empty

          const calSnap = await adminDb
            .collection('hosts').doc(hData.hostId)
            .collection('connected_calendars').limit(1).get()
          const hasCalendar = !calSnap.empty

          return {
            uid: hData.hostId,
            name: profile?.name ?? hData.hostId,
            email: profile?.email ?? '',
            avatarUrl: profile?.avatarUrl ?? null,
            priority: hData.priority ?? 1,
            hasAvailability,
            hasCalendar,
          }
        })
      )

      return { id: d.id, ...d.data(), members } as any
    })
  )

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
          }
        })
      )
    ).filter(Boolean) as any[]
  } catch (e) {
    console.error('[team] collectionGroup query failed:', e)
  }

  const hasLinks = ownedLinks.length > 0
  const hasMemberships = teamLinks.length > 0

  return (
    <DashboardLayout user={{ email: user.email, name: host?.name }} pageTitle="Team">
      {!hasLinks && !hasMemberships ? (
        <div className="max-w-3xl mx-auto text-center space-y-4 py-16">
          <div className="w-14 h-14 bg-[#0D7377]/10 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">No team yet</h2>
            <p className="text-sm text-gray-500 mt-1">Create a booking link, give it a team name, and add your colleagues as hosts.</p>
          </div>
          <Link
            href="/dashboard/links/new"
            className="inline-flex items-center gap-1.5 bg-[#0D7377] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors"
          >
            Create a booking link →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Teams I own */}
          {hasLinks && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Your teams</h2>
              {ownedLinks.map((link) => {
                const displayName = link.teamName || link.title
                return (
                  <div key={link.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {/* Team header */}
                    <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-gray-100">
                      <div>
                        <h3 className="font-semibold text-gray-900">{displayName}</h3>
                        {link.teamName && (
                          <p className="text-xs text-gray-400 mt-0.5">{link.title} · {link.durationMinutes} min</p>
                        )}
                        {!link.teamName && (
                          <p className="text-xs text-gray-400 mt-0.5">{link.durationMinutes} min · {link.routingStrategy === 'round_robin' ? 'Round robin' : 'Priority'}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <InvitePanel bookingLinkSlug={link.slug} />
                        <Link
                          href={`/dashboard/links/${link.id}`}
                          className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="px-5 py-3">
                      {link.members.length === 0 ? (
                        <p className="text-sm text-gray-400 py-1">No members yet — <Link href={`/dashboard/links/${link.id}`} className="text-[#0D7377] hover:underline">add hosts</Link>.</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {link.members.map((m: any) => (
                            <div key={m.uid} className="flex items-center gap-3 py-2.5 first:pt-1 last:pb-1">
                              <Avatar name={m.name} avatarUrl={m.avatarUrl} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                                <p className="text-xs text-gray-400 truncate">{m.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusDot hasAvailability={m.hasAvailability} hasCalendar={m.hasCalendar} />
                                {link.routingStrategy === 'priority' && (
                                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">
                                    P{m.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>
          )}

          {/* Teams I'm part of */}
          {hasMemberships && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Teams you&apos;re part of</h2>
              {teamLinks.map((link) => {
                const displayName = link.teamName || link.title
                return (
                  <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={link.ownerName} avatarUrl={link.ownerAvatarUrl} size={9} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-400">Managed by {link.ownerName}</p>
                      </div>
                      <span className="text-xs font-medium text-[#0D7377] bg-[#0D7377]/10 rounded-full px-2.5 py-1">Host</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-[#0D7377] hover:underline truncate"
                      >
                        /book/{link.slug}
                      </a>
                      <Link href="/dashboard/settings" className="text-xs text-gray-400 hover:text-gray-700 transition-colors whitespace-nowrap">
                        Set availability →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

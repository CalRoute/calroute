export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import { getUserBilling } from '@/lib/billing/get-user-billing'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import LinkRowActions from './LinkRowActions'

export default async function LinksPage() {
  const user = await requireUser('/dashboard/links')

  const [hostSnap, billing] = await Promise.all([
    adminDb.collection('hosts').doc(user.uid).get(),
    getUserBilling(user.uid),
  ])
  const host = hostSnap.data()

  // Links I own
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
          return { id: linkSnap.id, ...data, ownerName: ownerSnap.data()?.name ?? data.ownerId }
        })
      )
    ).filter(Boolean) as any[]
  } catch (e) {
    console.error('[links] collectionGroup query failed:', e)
  }

  function initials(name: string) {
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Links' }]}
    >
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking links</h1>
            <p className="text-sm text-gray-500 mt-1">Share these links so customers can book time with you.</p>
          </div>
          {billing.isFree && links.length >= 1 ? (
            <Link
              href="/dashboard/settings?tab=billing"
              className="bg-[#0D7377] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              Upgrade for more links
            </Link>
          ) : (
            <Link
              href="/dashboard/links/new"
              className="bg-[#0D7377] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span className="text-lg leading-none">+</span> New link
            </Link>
          )}
        </div>

        {/* Free tier notice */}
        {billing.isFree && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-amber-800">
              Free plan is limited to 1 booking link.{' '}
              <Link href="/dashboard/settings?tab=billing" className="font-semibold underline hover:no-underline">
                Upgrade to Solo
              </Link>{' '}
              for unlimited links.
            </p>
          </div>
        )}

        {/* My links */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">My links</h2>
          {links.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 bg-[#0D7377]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-[#0D7377]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="font-medium text-gray-900 mb-1">No booking links yet</p>
              <p className="text-sm text-gray-500 mb-5">Create your first link and share it so customers can book time with you.</p>
              <Link
                href="/dashboard/links/new"
                className="inline-flex items-center gap-1.5 bg-[#0D7377] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5f63] transition-colors"
              >
                Create your first link →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">{link.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                      <span>{link.durationMinutes} min</span>
                      <span>·</span>
                      <span>{link.meetingType === 'phone_call' ? 'Phone call' : link.meetingType === 'in_person' ? 'In person' : 'Google Meet'}</span>
                      <span>·</span>
                      <span>{link.routingStrategy === 'round_robin' ? 'Round robin' : 'Priority'} routing</span>
                    </div>
                    <a
                      href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0D7377] hover:underline mt-2 block truncate"
                    >
                      {process.env.NEXT_PUBLIC_APP_URL}/book/{link.slug}
                    </a>
                    {link.members.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex -space-x-1.5">
                          {link.members.slice(0, 6).map((m: any) => (
                            <div
                              key={m.uid}
                              title={m.name}
                              className="w-6 h-6 rounded-full border-2 border-white bg-[#0D7377]/20 text-[#0D7377] flex items-center justify-center text-[10px] font-semibold overflow-hidden flex-shrink-0"
                            >
                              {m.avatarUrl
                                ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                : initials(m.name)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {link.members.length === 1 ? '1 host' : `${link.members.length} hosts`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <LinkRowActions
                      linkId={link.id}
                      slug={link.slug}
                      isActive={link.isActive}
                      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ''}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Team links */}
        {teamLinks.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links I host</h2>
            <p className="text-sm text-gray-500 mb-3">
              You&apos;re a host on these links managed by others. Set your{' '}
              <Link href="/dashboard/settings" className="text-[#0D7377] hover:underline">availability in Settings</Link>{' '}
              so bookings route to you correctly.
            </p>
            <div className="space-y-3">
              {teamLinks.map((link) => (
                <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">{link.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                        <span>{link.durationMinutes} min</span>
                        <span>·</span>
                        <span>Managed by {link.ownerName}</span>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL}/book/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0D7377] hover:underline mt-2 block truncate"
                      >
                        {process.env.NEXT_PUBLIC_APP_URL}/book/{link.slug}
                      </a>
                    </div>
                    <span className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                      Host
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  )
}

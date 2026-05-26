import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceSupabase = await createServiceClient()
  const { data: host } = await serviceSupabase
    .from('hosts')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  const { data: links } = host
    ? await serviceSupabase
        .from('booking_links')
        .select('*, booking_link_hosts(count)')
        .eq('owner_id', host.id)
        .order('created_at', { ascending: false })
    : { data: [] }

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

        {(!links || links.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No booking links yet.</p>
            <Link
              href="/dashboard/links/new"
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              Create your first link →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link: any) => (
              <div key={link.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{link.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {link.duration_minutes} min · {link.routing_strategy} routing
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

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-gray-900 antialiased">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">CalRoute</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Features</a>
            <a href="#how" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">How it works</a>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link
              href="/login"
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            Free to get started · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            Scheduling that routes
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">to the right person</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Share one booking link. CalRoute checks every team member&apos;s calendar in real time and routes the meeting to whoever is actually free — no back-and-forth, no double-bookings.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-200"
            >
              Start for free →
            </Link>
            <a
              href="/book/test-availability"
              className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-base font-medium hover:bg-gray-50 transition-colors"
            >
              See a live demo
            </a>
          </div>
        </div>

        {/* Mock booking widget preview */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400 font-mono">calroute.me/book/your-link</span>
            </div>
            <div className="p-8">
              <div className="flex gap-8">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Select a date</p>
                  <div className="grid grid-cols-7 gap-1 mb-6">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                      <div key={i} className="text-center text-xs text-gray-400 py-1">{d}</div>
                    ))}
                    {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                      <div key={d} className={`text-center text-xs py-2 rounded-lg cursor-pointer transition-colors ${
                        d === 12 ? 'bg-violet-600 text-white font-semibold' :
                        [3,4,5,9,10,11,16,17].includes(d) ? 'text-gray-300' :
                        'text-gray-700 hover:bg-gray-100'
                      }`}>{d}</div>
                    ))}
                  </div>
                </div>
                <div className="w-44 flex-shrink-0">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Available times</p>
                  <div className="space-y-2">
                    {['9:00 AM','9:30 AM','10:00 AM','11:00 AM','2:00 PM','3:30 PM'].map(t => (
                      <div key={t} className={`py-2 px-3 rounded-lg border text-sm font-medium text-center cursor-pointer transition-colors ${
                        t === '10:00 AM' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-700 hover:border-violet-300'
                      }`}>{t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Social proof */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400 mb-6">Trusted by teams who are done playing calendar ping-pong</p>
          <div className="flex items-center justify-center gap-10 flex-wrap text-gray-300 font-semibold text-lg tracking-tight">
            <span>Acme Corp</span>
            <span>·</span>
            <span>Globex</span>
            <span>·</span>
            <span>Initech</span>
            <span>·</span>
            <span>Umbrella</span>
            <span>·</span>
            <span>Hooli</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Everything your team needs</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">Stop forwarding availability spreadsheets. CalRoute handles the routing automatically.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '📅',
                title: 'Multi-calendar merging',
                desc: 'Connect up to 5 Google Calendars per person. CalRoute merges them all to find genuine free slots — work, personal, side projects, all of it.',
              },
              {
                icon: '🎯',
                title: 'Smart host routing',
                desc: 'Priority routing assigns your best-fit host first. Round-robin keeps the workload balanced across your team automatically.',
              },
              {
                icon: '⚡',
                title: 'Race condition protection',
                desc: 'Slots are reserved for 5 minutes while the customer fills out the form. No two people can book the same slot at the same time.',
              },
              {
                icon: '🌍',
                title: 'Timezone aware',
                desc: 'Customers see times in their local timezone, hosts see them in theirs. Zero confusion, zero conversion errors.',
              },
              {
                icon: '📧',
                title: 'Confirmation emails',
                desc: 'Both the customer and host get an email the moment a booking is confirmed, with all the details and a Google Meet link.',
              },
              {
                icon: '🔗',
                title: 'Embeddable widget',
                desc: 'Drop a single iframe tag into any webpage and your booking widget appears — fully functional, no redirect needed.',
              },
            ].map(f => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 hover:bg-violet-50 transition-colors group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-violet-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed group-hover:text-violet-700">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-28 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Up and running in minutes</h2>
            <p className="text-lg text-gray-500">No complex setup. No per-seat pricing surprises.</p>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Connect your Google Calendar', desc: 'Sign in with Google and connect up to 5 calendars. CalRoute reads your free/busy data — it never touches your event details.' },
              { step: '02', title: 'Create a booking link', desc: 'Set your meeting duration, buffer times, availability hours, and routing strategy. Takes about 60 seconds.' },
              { step: '03', title: 'Share the link', desc: 'Send calroute.me/book/your-link to anyone. They pick a time, fill in their name and email, done.' },
              { step: '04', title: 'Show up to the meeting', desc: 'CalRoute creates the Google Calendar event, sends confirmation emails to both sides, and handles all the logistics.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-6 bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-3xl font-bold text-gray-100 flex-shrink-0 w-12">{s.step}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Why not just use Calendly?</h2>
            <p className="text-lg text-gray-500">Calendly is great for individuals. CalRoute is built for teams.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="font-semibold text-gray-400 mb-4 text-sm uppercase tracking-wider">Calendly & alternatives</p>
              <ul className="space-y-3 text-sm text-gray-500">
                {[
                  'One calendar per person',
                  'Manual round-robin setup',
                  'Per-seat pricing adds up fast',
                  'No cross-team routing logic',
                  'Redirect-only embeds',
                ].map(i => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-red-400">✕</span> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-violet-500 bg-violet-50 p-6">
              <p className="font-semibold text-violet-600 mb-4 text-sm uppercase tracking-wider">CalRoute</p>
              <ul className="space-y-3 text-sm text-gray-700">
                {[
                  'Up to 5 calendars merged per person',
                  'Automatic priority & round-robin routing',
                  'Flat pricing, unlimited team members',
                  'Cross-team availability & routing',
                  'Native embeddable widget',
                ].map(i => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-violet-500">✓</span> {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 bg-gradient-to-br from-violet-900 via-indigo-900 to-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to stop the calendar chaos?</h2>
          <p className="text-gray-400 text-lg mb-10">Free to start. No credit card. Takes 2 minutes to set up.</p>
          <Link
            href="/login"
            className="inline-block bg-white text-gray-900 font-semibold px-10 py-4 rounded-xl text-base hover:bg-gray-100 transition-colors"
          >
            Create your booking link →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-gray-900">CalRoute</span>
          <p className="text-sm text-gray-400">© 2026 CalRoute. Smart scheduling for teams.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}

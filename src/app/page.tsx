import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="bg-[#080808] text-white antialiased min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-white">CalRoute</span>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-xs text-white/40 hover:text-white/80 transition-colors hidden sm:block">Features</a>
            <a href="#how" className="text-xs text-white/40 hover:text-white/80 transition-colors hidden sm:block">How it works</a>
            <Link href="/login" className="text-xs text-white/40 hover:text-white/80 transition-colors">Sign in</Link>
            <Link
              href="/login"
              className="text-xs font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-white/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-14 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Now live · Free to start
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-[96px] font-bold tracking-[-0.03em] leading-[0.95] mb-8">
            One link.
            <br />
            <span className="text-white/20">Every calendar.</span>
            <br />
            Right person.
          </h1>

          <p className="text-white/40 text-lg max-w-lg mx-auto mb-12 leading-relaxed">
            Stop forwarding availability. CalRoute reads your whole team's calendars and routes each booking to whoever is actually free.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-black font-medium text-sm px-8 py-3 rounded-lg hover:bg-white/90 transition-colors"
            >
              Create your link — it&apos;s free
            </Link>
            <a
              href="/book/test-availability"
              className="inline-flex items-center justify-center gap-2 border border-white/10 text-white/60 text-sm px-8 py-3 rounded-lg hover:border-white/20 hover:text-white/80 transition-colors"
            >
              See a live demo →
            </a>
          </div>
        </div>

        {/* Terminal-style preview */}
        <div className="relative mt-20 w-full max-w-2xl mx-auto">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden backdrop-blur-sm">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-[11px] text-white/20 font-mono">calroute.me/book/sales-call</span>
            </div>
            <div className="p-6">
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest mb-3">June 2026</p>
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                      <div key={i} className="text-center text-[10px] text-white/20 py-1">{d}</div>
                    ))}
                    {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                      <div key={d} className={`text-center text-[11px] py-1.5 rounded-md cursor-pointer transition-colors ${
                        d === 12 ? 'bg-violet-500 text-white font-semibold' :
                        [1,7,8,14,15,21,22,28,29].includes(d) ? 'text-white/15' :
                        'text-white/50 hover:bg-white/5'
                      }`}>{d}</div>
                    ))}
                  </div>
                </div>
                <div className="w-36 flex-shrink-0">
                  <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest mb-3">Friday, Jun 12</p>
                  <div className="space-y-1.5">
                    {[
                      { t: '9:00 AM', host: 'A' },
                      { t: '10:00 AM', host: 'B' },
                      { t: '11:00 AM', host: 'A' },
                      { t: '2:00 PM', host: 'C' },
                      { t: '3:30 PM', host: 'B' },
                    ].map((s, i) => (
                      <div key={i} className={`flex items-center justify-between py-1.5 px-2.5 rounded-md border text-[11px] ${
                        i === 1
                          ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                          : 'border-white/[0.06] text-white/40 hover:border-white/10'
                      }`}>
                        <span>{s.t}</span>
                        <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/30">{s.host}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-white/25">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Routing to next available host · 5 calendars checked
              </div>
            </div>
          </div>
          {/* Fade out bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { n: '< 2min', label: 'to set up your first link' },
            { n: '5×', label: 'calendars merged per person' },
            { n: '0', label: 'double-bookings. ever.' },
          ].map(s => (
            <div key={s.n}>
              <p className="text-3xl font-bold tracking-tight mb-1">{s.n}</p>
              <p className="text-xs text-white/30">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Features</p>
          <h2 className="text-4xl font-bold tracking-tight mb-16 max-w-lg leading-tight">
            Built for teams, not just individuals
          </h2>

          <div className="grid md:grid-cols-2 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {[
              {
                icon: '⌀',
                title: 'Multi-calendar merging',
                desc: 'Connect up to 5 Google Calendars per team member. Work, personal, side projects — all merged into one honest availability view.',
              },
              {
                icon: '→',
                title: 'Smart host routing',
                desc: 'Priority routing or round-robin — CalRoute assigns the right person automatically. No spreadsheet, no manual intervention.',
              },
              {
                icon: '⏱',
                title: 'Race condition protection',
                desc: 'Slots are held for 5 minutes while someone books. Two people trying at once? Only one gets it. Always.',
              },
              {
                icon: '⊕',
                title: 'Embeddable anywhere',
                desc: 'One iframe. Drop it into your website, docs, or Notion page. The full booking experience, no redirect.',
              },
              {
                icon: '◑',
                title: 'Timezone intelligence',
                desc: 'Customers see their timezone. You see yours. No mental math, no "which timezone?" email.',
              },
              {
                icon: '✉',
                title: 'Instant confirmations',
                desc: 'Host and customer both get an email with the Google Meet link the second a booking is confirmed.',
              },
            ].map(f => (
              <div key={f.title} className="bg-[#080808] p-8 hover:bg-white/[0.02] transition-colors">
                <span className="text-white/20 text-2xl font-mono mb-4 block">{f.icon}</span>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-4">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight mb-16">Up in 2 minutes flat</h2>

          <div className="relative">
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-white/[0.06]" />
            <div className="space-y-10">
              {[
                { n: '1', title: 'Connect your calendar', desc: 'Sign in with Google. Connect up to 5 calendars. CalRoute only reads free/busy — it never sees your event details.' },
                { n: '2', title: 'Create a booking link', desc: 'Name it, set the duration, pick your routing strategy (priority or round-robin), set your hours. 60 seconds.' },
                { n: '3', title: 'Share it', desc: 'Send calroute.me/book/your-link. That\'s it. Anyone can book — no account required on their end.' },
                { n: '4', title: 'Show up', desc: 'CalRoute creates the calendar event, sends confirmation emails, adds the Google Meet link. You just show up.' },
              ].map(s => (
                <div key={s.n} className="flex gap-6">
                  <div className="w-10 h-10 rounded-full border border-white/[0.08] bg-[#080808] flex items-center justify-center text-xs font-medium text-white/40 flex-shrink-0 relative z-10">
                    {s.n}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                    <p className="text-sm text-white/30 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* vs section */}
      <section className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Why CalRoute</p>
          <h2 className="text-4xl font-bold tracking-tight mb-4">Calendly is for individuals.<br />We're for teams.</h2>
          <p className="text-white/30 text-sm mb-12">Calendly pioneered the space. CalRoute solves what they left unfinished.</p>

          <div className="space-y-3">
            {[
              { them: 'One calendar per person', us: 'Up to 5 calendars merged — work, personal, all of it' },
              { them: 'Manual round-robin setup', us: 'Automatic routing — priority or round-robin, configured in seconds' },
              { them: 'Per-seat pricing scales painfully', us: 'Flat pricing, add your whole team' },
              { them: 'Redirect-only booking pages', us: 'Native embeddable widget — drop an iframe, done' },
            ].map((r, i) => (
              <div key={i} className="grid grid-cols-2 gap-px bg-white/[0.06] rounded-xl overflow-hidden text-sm">
                <div className="bg-[#080808] px-5 py-4 text-white/25 flex items-center gap-3">
                  <span className="text-red-500/60 text-xs">✕</span>
                  {r.them}
                </div>
                <div className="bg-white/[0.02] px-5 py-4 text-white/70 flex items-center gap-3">
                  <span className="text-emerald-400 text-xs">✓</span>
                  {r.us}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-4">Start routing smarter.</h2>
          <p className="text-white/30 mb-10">Free forever for individuals. No credit card.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold text-sm px-10 py-4 rounded-xl hover:bg-white/90 transition-colors"
          >
            Create your booking link →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-semibold text-white/60">CalRoute</span>
          <p className="text-xs text-white/20">© 2026 CalRoute. Smart scheduling for teams.</p>
          <div className="flex gap-6 text-xs text-white/20">
            <a href="#features" className="hover:text-white/50 transition-colors">Features</a>
            <a href="#how" className="hover:text-white/50 transition-colors">How it works</a>
            <Link href="/login" className="hover:text-white/50 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}

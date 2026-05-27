import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="bg-[#F7F4EF] text-[#1a1a1a] antialiased min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F4EF]/90 backdrop-blur-xl border-b border-[#1a1a1a]/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">CalRoute</span>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors hidden sm:block">Features</a>
            <a href="#how" className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors hidden sm:block">How it works</a>
            <Link href="/login" className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors">Sign in</Link>
            <Link
              href="/login"
              className="text-xs font-semibold bg-[#0D7377] text-white px-4 py-2 rounded-lg hover:bg-[#0a5f63] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-14">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-[#0D7377]/20 bg-[#0D7377]/8 text-[#0D7377] text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#0D7377] rounded-full animate-pulse" />
            Free to start · No credit card
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-[88px] font-bold tracking-[-0.03em] leading-[0.95] mb-8">
            Scheduling that finds
            <br />
            <em className="not-italic text-[#0D7377]">the right person</em>
            <br />
            automatically.
          </h1>

          <p className="text-[#1a1a1a]/50 text-xl max-w-xl mx-auto mb-12 leading-relaxed font-light">
            One booking link. CalRoute checks your whole team&apos;s calendars in real time and routes each meeting to whoever is actually free.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[#0D7377] text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-[#0a5f63] transition-colors shadow-lg shadow-[#0D7377]/20"
            >
              Create your booking link →
            </Link>
            <a
              href="/book/test-availability"
              className="inline-flex items-center justify-center border border-[#1a1a1a]/10 text-[#1a1a1a]/60 text-sm px-8 py-3.5 rounded-xl hover:border-[#1a1a1a]/20 hover:text-[#1a1a1a] transition-colors bg-white/60"
            >
              See a live demo
            </a>
          </div>
        </div>

        {/* Booking widget mockup */}
        <div className="mt-20 w-full max-w-2xl mx-auto">
          <div className="rounded-2xl border border-[#1a1a1a]/[0.08] bg-white shadow-xl shadow-[#1a1a1a]/[0.06] overflow-hidden">
            <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-[#1a1a1a]/[0.06] bg-[#f9f7f3]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/10" />
              <span className="ml-3 text-[11px] text-[#1a1a1a]/30 font-mono">calroute.me/book/sales-call</span>
            </div>
            <div className="p-7">
              <div className="flex gap-8">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-[#1a1a1a]/30 uppercase tracking-widest mb-3">Select a date</p>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['M','T','W','T','F','S','S'].map((d, i) => (
                      <div key={i} className="text-center text-[10px] text-[#1a1a1a]/30 py-1">{d}</div>
                    ))}
                    {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                      <div key={d} className={`text-center text-[11px] py-2 rounded-lg cursor-pointer transition-colors ${
                        d === 12 ? 'bg-[#0D7377] text-white font-semibold' :
                        [1,7,8,14,15,21,22,28,29,30].includes(d) ? 'text-[#1a1a1a]/20' :
                        'text-[#1a1a1a]/60 hover:bg-[#0D7377]/8'
                      }`}>{d}</div>
                    ))}
                  </div>
                </div>
                <div className="w-40 flex-shrink-0">
                  <p className="text-[10px] font-semibold text-[#1a1a1a]/30 uppercase tracking-widest mb-3">Available</p>
                  <div className="space-y-1.5">
                    {[
                      { t: '9:00 AM', host: 'Alex' },
                      { t: '10:00 AM', host: 'Beth' },
                      { t: '11:30 AM', host: 'Alex' },
                      { t: '2:00 PM', host: 'Carl' },
                      { t: '3:30 PM', host: 'Beth' },
                    ].map((s, i) => (
                      <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                        i === 1
                          ? 'border-[#0D7377]/40 bg-[#0D7377]/8 text-[#0D7377] font-medium'
                          : 'border-[#1a1a1a]/08 text-[#1a1a1a]/50 hover:border-[#0D7377]/20 hover:text-[#1a1a1a]/70'
                      }`}>
                        <span>{s.t}</span>
                        <span className="text-[9px] bg-[#1a1a1a]/05 px-1.5 py-0.5 rounded text-[#1a1a1a]/30">{s.host}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-[#1a1a1a]/[0.06] flex items-center gap-2 text-[11px] text-[#1a1a1a]/30">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Auto-routed · 3 calendars checked · 0 conflicts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-[#1a1a1a]/[0.06] bg-white/50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { n: '< 2 min', label: 'to set up your first link' },
            { n: '5×', label: 'calendars merged per person' },
            { n: '0', label: 'double-bookings, guaranteed' },
          ].map(s => (
            <div key={s.n}>
              <p className="text-4xl font-bold tracking-tight mb-1 text-[#0D7377]">{s.n}</p>
              <p className="text-xs text-[#1a1a1a]/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl font-bold tracking-tight mb-16 max-w-lg leading-tight">
            Everything a team needs to stop playing calendar ping-pong
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '📅', title: 'Multi-calendar merging', desc: 'Connect up to 5 Google Calendars per person. Work, personal, side projects — all merged into one honest view.' },
              { icon: '🎯', title: 'Smart host routing', desc: 'Priority or round-robin — CalRoute assigns the right person automatically. Zero spreadsheet required.' },
              { icon: '⚡', title: 'Race condition proof', desc: 'Slots are held for 5 minutes while someone books. Two people trying at once? Only one gets it. Always.' },
              { icon: '🌍', title: 'Timezone aware', desc: 'Customers see their timezone. Hosts see theirs. No "which timezone is that?" emails. Ever.' },
              { icon: '📧', title: 'Instant confirmations', desc: 'Both sides get an email the second a booking is confirmed, with the Google Meet link included.' },
              { icon: '🔗', title: 'Embeddable widget', desc: 'One iframe tag. Drop it into any website or Notion page and the full booking widget appears inline.' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/[0.06] hover:border-[#0D7377]/30 hover:shadow-md hover:shadow-[#0D7377]/[0.06] transition-all group">
                <span className="text-2xl mb-4 block">{f.icon}</span>
                <h3 className="text-sm font-semibold mb-2 group-hover:text-[#0D7377] transition-colors">{f.title}</h3>
                <p className="text-sm text-[#1a1a1a]/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-32 px-6 bg-white/60 border-t border-[#1a1a1a]/[0.06]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight mb-16 leading-tight">Up and running in under 2 minutes</h2>

          <div className="space-y-5">
            {[
              { n: '01', title: 'Connect your calendar', desc: 'Sign in with Google and connect up to 5 calendars. CalRoute reads only free/busy data — never your event details.' },
              { n: '02', title: 'Create a booking link', desc: 'Set your duration, buffer times, availability hours, and routing strategy. Takes about 60 seconds.' },
              { n: '03', title: 'Share the link', desc: 'Send calroute.me/book/your-link to anyone. No account needed on their end.' },
              { n: '04', title: 'Show up to the meeting', desc: 'CalRoute creates the calendar event and sends confirmation emails to both sides. You just show up.' },
            ].map(s => (
              <div key={s.n} className="flex gap-6 bg-white rounded-2xl p-6 border border-[#1a1a1a]/[0.06]">
                <span className="text-3xl font-bold text-[#0D7377]/15 flex-shrink-0 w-12 leading-none pt-0.5">{s.n}</span>
                <div>
                  <h3 className="font-semibold text-[#1a1a1a] mb-1 text-sm">{s.title}</h3>
                  <p className="text-sm text-[#1a1a1a]/40 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vs */}
      <section className="py-32 px-6 border-t border-[#1a1a1a]/[0.06]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-3">Why CalRoute</p>
          <h2 className="text-4xl font-bold tracking-tight mb-3">Calendly is for individuals.</h2>
          <p className="text-[#1a1a1a]/40 mb-12">We built what they left unfinished.</p>

          <div className="rounded-2xl border border-[#1a1a1a]/[0.06] overflow-hidden bg-white">
            <div className="grid grid-cols-2 border-b border-[#1a1a1a]/[0.06]">
              <div className="px-6 py-3 text-xs font-semibold text-[#1a1a1a]/30 uppercase tracking-wider border-r border-[#1a1a1a]/[0.06]">Others</div>
              <div className="px-6 py-3 text-xs font-semibold text-[#0D7377] uppercase tracking-wider">CalRoute</div>
            </div>
            {[
              { them: 'One calendar per person', us: 'Up to 5 calendars merged per person' },
              { them: 'Manual round-robin setup', us: 'Automatic routing, configured in seconds' },
              { them: 'Per-seat pricing adds up fast', us: 'Flat pricing, your whole team included' },
              { them: 'Redirect-only booking pages', us: 'Native embeddable iframe widget' },
            ].map((r, i) => (
              <div key={i} className={`grid grid-cols-2 text-sm ${i < 3 ? 'border-b border-[#1a1a1a]/[0.06]' : ''}`}>
                <div className="px-6 py-4 text-[#1a1a1a]/35 flex items-center gap-3 border-r border-[#1a1a1a]/[0.06]">
                  <span className="text-[#1a1a1a]/20">✕</span> {r.them}
                </div>
                <div className="px-6 py-4 text-[#1a1a1a]/70 flex items-center gap-3 bg-[#0D7377]/[0.02]">
                  <span className="text-[#0D7377]">✓</span> {r.us}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 bg-[#0D7377] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight mb-4">Ready to stop the chaos?</h2>
          <p className="text-white/60 text-lg mb-10">Free forever for individuals. No credit card required.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-[#0D7377] font-bold text-sm px-10 py-4 rounded-xl hover:bg-[#F7F4EF] transition-colors"
          >
            Create your booking link →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F7F4EF] border-t border-[#1a1a1a]/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-semibold">CalRoute</span>
          <p className="text-xs text-[#1a1a1a]/30">© 2026 CalRoute. Smart scheduling for teams.</p>
          <div className="flex gap-6 text-xs text-[#1a1a1a]/30">
            <a href="#features" className="hover:text-[#0D7377] transition-colors">Features</a>
            <a href="#how" className="hover:text-[#0D7377] transition-colors">How it works</a>
            <Link href="/privacy" className="hover:text-[#0D7377] transition-colors">Privacy</Link>
            <Link href="/login" className="hover:text-[#0D7377] transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}

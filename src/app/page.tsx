import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="bg-white text-[#0f1117] antialiased min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg viewBox="0 0 100 100" className="w-9 h-9 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="landingLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <g transform="translate(15, 12)">
                <rect x="0" y="8" width="70" height="72" rx="14" fill="#1e293b" />
                <path d="M 0 20 L 70 20 L 70 20 C 70 13.37, 63.63 8, 56 8 L 14 8 C 6.37 8, 0 13.37, 0 20 Z" fill="#334155" />
                <rect x="16" y="0" width="8" height="14" rx="4" fill="#64748b" />
                <rect x="46" y="0" width="8" height="14" rx="4" fill="#64748b" />
                <path d="M 12 56 C 24 56, 26 38, 44 38" fill="none" stroke="url(#landingLogoGrad)" strokeWidth="7" strokeLinecap="round" />
                <rect x="36" y="30" width="16" height="16" rx="4" fill="none" stroke="#ffffff" strokeWidth="3" />
                <circle cx="44" cy="38" r="3.5" fill="#ffffff" />
                <path d="M 44 38 L 78 38" fill="none" stroke="url(#landingLogoGrad)" strokeWidth="7" strokeLinecap="round" />
                <path d="M 69 30 L 78 38 L 69 46" fill="none" stroke="url(#landingLogoGrad)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
            <span className="text-xl font-bold text-[#0f1117] group-hover:text-[#0D7377] transition-colors">
              Cal<span className="text-[#0D7377]">Route</span>
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm text-black/40 hover:text-black transition-colors hidden sm:block">Features</a>
            <a href="#how" className="text-sm text-black/40 hover:text-black transition-colors hidden sm:block">How it works</a>
            <a href="#pricing" className="text-sm text-black/40 hover:text-black transition-colors hidden sm:block">Pricing</a>
            <Link href="/login" className="text-sm text-black/40 hover:text-black transition-colors hidden sm:block">Sign in</Link>
            <Link
              href="/login"
              className="text-sm font-semibold bg-[#0D7377] text-white px-4 py-2 rounded-lg hover:bg-[#0a5f63] transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — dark */}
      <section className="bg-[#0f1117] text-white min-h-screen flex flex-col items-center justify-center px-6 pt-14 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs font-medium px-3 py-1.5 rounded-full mb-10">
            <span className="w-1.5 h-1.5 bg-[#0D7377] rounded-full animate-pulse" />
            Free to start · No credit card
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-bold tracking-[-0.03em] leading-[0.92] mb-8">
            One link.
            <br />
            <span className="text-[#0D7377]">Right person.</span>
            <br />
            Every time.
          </h1>

          <p className="text-white/50 text-lg sm:text-xl max-w-lg mx-auto mb-12 leading-relaxed">
            CalRoute checks your whole team&apos;s availability in real time and routes each booking to whoever is actually free — automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[#0D7377] text-white font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-[#0b8a8f] transition-colors"
            >
              Create your booking link →
            </Link>
            <a
              href="/book/test-availability"
              className="inline-flex items-center justify-center border border-white/10 text-white/50 text-sm px-8 py-3.5 rounded-xl hover:border-white/20 hover:text-white/80 transition-colors"
            >
              See a live demo
            </a>
          </div>
        </div>

        {/* Widget mockup */}
        <div className="mt-16 sm:mt-24 w-full max-w-2xl mx-auto">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur overflow-hidden shadow-2xl shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/[0.06] bg-white/[0.03]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-[11px] text-white/20 font-mono">calroute.me/book/sales-call</span>
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                {/* Calendar */}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Select a date</p>
                  {/* Mobile */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
                    {[8,9,10,11,12,13,14,15].map((d, i) => (
                      <div key={d} className={`flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl text-[10px] min-w-[40px] ${
                        d === 12 ? 'bg-[#0D7377] text-white' : 'bg-white/5 text-white/40'
                      }`}>
                        <span className="uppercase">{['M','T','W','T','F','S','S','M'][i]}</span>
                        <span className="font-bold text-sm mt-0.5">{d}</span>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] text-white/20 py-1">{d}</div>
                      ))}
                      {Array.from({length: 30}, (_, i) => i + 1).map(d => (
                        <div key={d} className={`text-center text-[11px] py-2 rounded-lg cursor-pointer transition-colors ${
                          d === 12 ? 'bg-[#0D7377] text-white font-semibold' :
                          [1,7,8,14,15,21,22,28,29,30].includes(d) ? 'text-white/15' :
                          'text-white/40 hover:bg-white/5'
                        }`}>{d}</div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Times */}
                <div className="sm:w-40 sm:flex-shrink-0">
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Available</p>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5">
                    {[
                      { t: '9:00 AM', host: 'Alex' },
                      { t: '10:00 AM', host: 'Beth' },
                      { t: '11:30 AM', host: 'Alex' },
                      { t: '2:00 PM', host: 'Carl' },
                      { t: '3:30 PM', host: 'Beth' },
                    ].map((s, i) => (
                      <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                        i === 1
                          ? 'border-[#0D7377]/50 bg-[#0D7377]/20 text-[#4ecdc4] font-medium'
                          : 'border-white/[0.06] text-white/30'
                      }`}>
                        <span>{s.t}</span>
                        <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/20">{s.host}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-white/20">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Auto-routed · 3 calendars checked · 0 conflicts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof ribbon */}
      <section className="py-10 border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
          {[
            { n: '60 sec', label: 'to create your first link' },
            { n: '5 calendars', label: 'merged per team member' },
            { n: 'Real-time', label: 'availability — no manual slots' },
          ].map(s => (
            <div key={s.n}>
              <p className="text-2xl font-bold text-[#0D7377] mb-0.5">{s.n}</p>
              <p className="text-xs text-black/40">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — 3 big blocks */}
      <section id="features" className="py-24 sm:py-36 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">What makes us different</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Built for teams.<br className="hidden sm:block" /> Not just individuals.
            </h2>
          </div>

          <div className="space-y-6">

            {/* Block 1 — Smart routing */}
            <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-black/[0.07]">
              <div className="bg-[#0f1117] text-white p-7 sm:p-10 lg:p-14 flex flex-col justify-center">
                <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-5">Smart routing</p>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">
                  One link routes to the right person.
                </h3>
                <p className="text-white/50 leading-relaxed text-base">
                  Share a single booking link with your team. CalRoute checks every host&apos;s calendar in real time and assigns the meeting — round-robin, by priority, or first available. No admin overhead, no missed assignments.
                </p>
              </div>
              <div className="bg-[#f5f5f7] p-7 sm:p-10 lg:p-14 flex flex-col justify-center gap-3">
                {[
                  { label: 'Alex Chen', status: 'In a meeting', dot: 'bg-red-400' },
                  { label: 'Beth Park', status: 'Available now', dot: 'bg-emerald-400', highlight: true },
                  { label: 'Carl Ross', status: 'Available at 2pm', dot: 'bg-amber-400' },
                ].map(h => (
                  <div key={h.label} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    h.highlight ? 'bg-white border-[#0D7377]/20 shadow-md shadow-[#0D7377]/10' : 'bg-white/60 border-black/[0.06]'
                  }`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      h.highlight ? 'bg-[#0D7377] text-white' : 'bg-black/10 text-black/40'
                    }`}>
                      {h.label.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${h.highlight ? 'text-[#0f1117]' : 'text-black/50'}`}>{h.label}</p>
                      <p className="text-xs text-black/40">{h.status}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${h.dot}`} />
                    {h.highlight && (
                      <span className="text-[10px] font-semibold bg-[#0D7377] text-white px-2 py-1 rounded-lg">Assigned</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Block 2 — Multi-calendar */}
            <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden border border-black/[0.07]">
              <div className="bg-[#f5f5f7] p-7 sm:p-10 lg:p-14 flex flex-col justify-center gap-4 order-2 lg:order-1">
                <div className="space-y-3">
                  {[
                    { cal: 'Work — Google', events: 3, color: 'bg-blue-500' },
                    { cal: 'Personal — Google', events: 1, color: 'bg-purple-400' },
                    { cal: 'Side project', events: 2, color: 'bg-amber-400' },
                  ].map(c => (
                    <div key={c.cal} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-black/[0.06]">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.color}`} />
                      <span className="text-sm text-black/70 flex-1 min-w-0 truncate">{c.cal}</span>
                      <span className="text-xs text-black/30 hidden sm:block whitespace-nowrap">{c.events} events today</span>
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex-shrink-0">Synced</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-center py-3 border-2 border-dashed border-black/10 rounded-2xl">
                    <span className="text-xs text-black/30">+ Connect up to 5 calendars</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-7 sm:p-10 lg:p-14 flex flex-col justify-center order-1 lg:order-2">
                <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-5">Multi-calendar merging</p>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-5">
                  Your whole life, one honest schedule.
                </h3>
                <p className="text-black/50 leading-relaxed text-base">
                  Each team member connects up to 5 Google calendars — work, personal, side projects. CalRoute merges them into one conflict-free availability view. Customers only see slots where you&apos;re genuinely free.
                </p>
              </div>
            </div>

            {/* Block 3 — Grid of smaller features */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Timezone intelligence',
                  desc: 'Customers book in their timezone. Your team sees theirs. Zero confusion, zero emails asking "which timezone?"',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  ),
                },
                {
                  title: 'Phone & video calls',
                  desc: 'Offer phone calls, Google Meet, or both. Customers pick what works for them — you get the details in the confirmation.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  ),
                },
                {
                  title: 'Language-based routing',
                  desc: 'Global team? Customers pick their language — CalRoute only shows hosts who speak it. Simple, respectful, effective.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                    </svg>
                  ),
                },
                {
                  title: 'Guest self-service',
                  desc: 'Customers reschedule or cancel up to 24h before — on their own, without emailing you. You get notified instantly.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  ),
                },
                {
                  title: 'Webhooks & REST API',
                  desc: 'Get real-time booking events in your own systems. HMAC-signed payloads, full API docs, no rate-limit surprises.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  ),
                },
                {
                  title: 'Embeddable widget',
                  desc: 'One iframe. Drop it in your website, Notion, or email. The booking experience appears inline — no redirects.',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25" />
                    </svg>
                  ),
                },
              ].map(f => (
                <div key={f.title} className="bg-white rounded-2xl p-7 border border-black/[0.07] hover:border-[#0D7377]/30 hover:shadow-md hover:shadow-[#0D7377]/[0.06] transition-all group">
                  <div className="w-9 h-9 bg-[#0D7377]/8 rounded-xl flex items-center justify-center text-[#0D7377] mb-5 group-hover:bg-[#0D7377]/15 transition-colors">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-[#0f1117] mb-2">{f.title}</h3>
                  <p className="text-sm text-black/45 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 sm:py-36 px-6 bg-[#f5f5f7] border-t border-black/[0.06]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-14 leading-tight">Up and running in 60 seconds.</h2>

          <div className="space-y-4">
            {[
              { n: '1', title: 'Connect your Google Calendar', desc: 'Sign in with Google and link up to 5 calendars. CalRoute reads only free/busy data — never your event titles or details.' },
              { n: '2', title: 'Create a booking link', desc: 'Set duration, buffer time, availability hours, and routing strategy. Invite teammates as hosts on the same link.' },
              { n: '3', title: 'Share it anywhere', desc: 'Send calroute.me/book/your-slug to anyone — no account needed on their end. Embed it on your site with one iframe.' },
              { n: '4', title: 'Just show up', desc: 'CalRoute creates the Google Calendar event, sends confirmation emails to both sides, and notifies your team instantly.' },
            ].map(s => (
              <div key={s.n} className="flex gap-5 bg-white rounded-2xl px-7 py-6 border border-black/[0.06]">
                <div className="w-8 h-8 rounded-xl bg-[#0D7377] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0f1117] mb-1">{s.title}</h3>
                  <p className="text-sm text-black/45 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 sm:py-36 px-6 border-t border-black/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">Why CalRoute</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Built for teams, not individuals.</h2>
            <p className="text-lg text-black/40">We finished what other scheduling tools left half-done.</p>
          </div>

          <div className="rounded-3xl border border-black/[0.08] overflow-hidden shadow-xl shadow-black/[0.04]">
            <div className="grid grid-cols-2 border-b border-black/[0.08] bg-[#f5f5f7]">
              <div className="px-4 sm:px-8 py-4 text-xs font-semibold text-black/35 uppercase tracking-wider border-r border-black/[0.08]">Other tools</div>
              <div className="px-4 sm:px-8 py-4 text-xs font-semibold text-[#0D7377] uppercase tracking-wider">CalRoute</div>
            </div>
            {[
              { them: 'One calendar per person', us: 'Up to 5 calendars merged' },
              { them: 'Manual round-robin setup', us: 'Auto-routing in seconds' },
              { them: 'Stale, manually-set slots', us: 'Live calendar availability' },
              { them: 'No phone call option', us: 'Phone or video — your choice' },
              { them: 'Static confirmation emails', us: 'Custom branded templates' },
              { them: 'No API access', us: 'Full REST API + webhooks' },
              { them: 'Per-seat pricing', us: 'From $10/mo flat' },
              { them: 'Redirects externally', us: 'Embeds on your site' },
            ].map((r, i, arr) => (
              <div key={i} className={`grid grid-cols-2 text-xs sm:text-sm ${i < arr.length - 1 ? 'border-b border-black/[0.06]' : ''}`}>
                <div className="px-4 sm:px-8 py-3.5 sm:py-5 text-black/35 flex items-start gap-2 sm:gap-3 border-r border-black/[0.06]">
                  <span className="text-black/20 flex-shrink-0 font-bold mt-0.5">✕</span>
                  <span>{r.them}</span>
                </div>
                <div className="px-4 sm:px-8 py-3.5 sm:py-5 text-[#0f1117]/80 flex items-start gap-2 sm:gap-3 bg-[#0D7377]/[0.03]">
                  <span className="text-[#0D7377] flex-shrink-0 font-bold mt-0.5">✓</span>
                  <span>{r.us}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 sm:py-36 px-6 bg-[#f5f5f7] border-t border-black/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Simple, honest pricing.</h2>
            <p className="text-lg text-black/40">Start free. Upgrade only when you&apos;re ready.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border border-black/[0.07]">
              <p className="font-semibold text-[#0f1117] mb-1">Free</p>
              <p className="text-sm text-black/40 mb-6">Get started, no card needed</p>
              <div className="mb-7">
                <span className="text-4xl font-bold text-[#0f1117]">$0</span>
                <span className="text-black/40 text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-black/60">
                {['1 booking link', 'Unlimited bookings', 'Phone + video meetings', 'Google Calendar sync'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full inline-block text-center border border-black/10 text-[#0f1117] font-semibold text-sm px-6 py-3 rounded-xl hover:border-black/20 transition-colors">
                Start for free →
              </Link>
            </div>

            {/* Solo — featured */}
            <div className="bg-[#0f1117] rounded-3xl p-8 border border-transparent relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="inline-flex items-center gap-1.5 bg-[#0D7377] text-white text-[10px] font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-1 h-1 bg-white rounded-full" />
                  Most popular
                </div>
              </div>
              <p className="font-semibold text-white mb-1">Solo</p>
              <p className="text-sm text-white/40 mb-6">Everything you need</p>
              <div className="mb-7">
                <span className="text-4xl font-bold text-white">$10</span>
                <span className="text-white/40 text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-white/60">
                {['Unlimited booking links', 'Custom email templates', 'Full analytics', 'Webhooks & REST API', 'Priority support'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full inline-block text-center bg-[#0D7377] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#0b8a8f] transition-colors">
                Get Solo →
              </Link>
            </div>

            {/* Team */}
            <div className="bg-white rounded-3xl p-8 border border-black/[0.07]">
              <p className="font-semibold text-[#0f1117] mb-1">Team</p>
              <p className="text-sm text-black/40 mb-6">Shared routing pools</p>
              <div className="mb-7">
                <div>
                  <span className="text-4xl font-bold text-[#0f1117]">$10</span>
                  <span className="text-black/40 text-sm ml-2">/ mo base</span>
                </div>
                <p className="text-sm text-black/40 mt-1">+ $2 per seat</p>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-black/60">
                {['Everything in Solo', 'Multi-host booking links', 'Round-robin & priority routing', 'Real-time team availability', '50% off Solo for team members'].map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login" className="w-full inline-block text-center border border-black/10 text-[#0f1117] font-semibold text-sm px-6 py-3 rounded-xl hover:border-black/20 transition-colors">
                Get Team →
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-black/35">All plans include a 14-day free trial. No credit card required.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-36 px-6 bg-[#0f1117] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-6">Get started today</p>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-[0.95]">
            Stop asking<br />&ldquo;who&apos;s free?&rdquo;
          </h2>
          <p className="text-white/40 text-lg mb-12">CalRoute already knows. 14-day free trial, no card needed.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#0D7377] text-white font-bold text-base px-10 py-4 rounded-xl hover:bg-[#0b8a8f] transition-colors"
          >
            Create your booking link →
          </Link>
          <p className="text-white/25 text-sm mt-6">Takes under 60 seconds.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-black/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#0f1117]">Cal<span className="text-[#0D7377]">Route</span></span>
          <p className="text-xs text-black/30">© 2026 CalRoute. Smart scheduling for teams.</p>
          <div className="flex gap-6 text-xs text-black/30">
            <a href="#features" className="hover:text-[#0D7377] transition-colors">Features</a>
            <a href="#how" className="hover:text-[#0D7377] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#0D7377] transition-colors">Pricing</a>
            <Link href="/privacy" className="hover:text-[#0D7377] transition-colors">Privacy</Link>
            <Link href="/login" className="hover:text-[#0D7377] transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="bg-[#F7F4EF] text-[#1a1a1a] antialiased min-h-screen">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F4EF]/90 backdrop-blur-xl border-b border-[#1a1a1a]/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <svg viewBox="0 0 440 100" className="w-40 h-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="text-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <g transform="translate(16, 12) scale(0.8)">
              <rect x="0" y="6" width="60" height="62" rx="10" fill="#1e293b" />
              <path d="M 0 16 L 60 16 L 60 16 C 60 10.47, 55.53 6, 50 6 L 10 6 C 4.47 6, 0 10.47, 0 16 Z" fill="#334155" />
              <rect x="14" y="0" width="6" height="10" rx="3" fill="#64748b" />
              <rect x="40" y="0" width="6" height="10" rx="3" fill="#64748b" />
              <rect x="10" y="24" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="25" y="24" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="40" y="24" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="10" y="39" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="40" y="39" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="10" y="54" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="25" y="54" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <rect x="40" y="54" width="10" height="10" rx="2.5" fill="#0b0f19" opacity="0.6" />
              <path d="M -6 35 C 4 35, 12 44, 30 44" fill="none" stroke="url(#text-route-grad)" strokeWidth="5" strokeLinecap="round" />
              <rect x="25" y="39" width="10" height="10" rx="2.5" fill="none" stroke="#ffffff" strokeWidth="2" />
              <circle cx="30" cy="44" r="2.5" fill="#ffffff" />
              <path d="M 30 44 L 68 44" fill="none" stroke="url(#text-route-grad)" strokeWidth="5" strokeLinecap="round" />
              <path d="M 61 38 L 68 44 L 61 50" fill="none" stroke="url(#text-route-grad)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x="96" y="52" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="34" fill="#1a1a1a" letterSpacing="-0.5">Cal<tspan fill="url(#text-route-grad)">Route</tspan></text>
          </svg>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors hidden sm:block">Features</a>
            <a href="#how" className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors hidden sm:block">How it works</a>
            <a href="#pricing" className="text-xs text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors hidden sm:block">Pricing</a>
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

          <h1 className="text-4xl sm:text-6xl lg:text-[80px] font-bold tracking-[-0.03em] leading-[0.95] mb-8">
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
        <div className="mt-14 sm:mt-20 w-full max-w-2xl mx-auto">
          <div className="rounded-2xl border border-[#1a1a1a]/[0.08] bg-white shadow-xl shadow-[#1a1a1a]/[0.06] overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#1a1a1a]/[0.06] bg-[#f9f7f3]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]/10" />
              <span className="ml-3 text-[11px] text-[#1a1a1a]/30 font-mono">calroute.me/book/sales-call</span>
            </div>
            <div className="p-5 sm:p-7">
              {/* Mobile: stacked layout. Desktop: side by side */}
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                {/* Date strip */}
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-[#1a1a1a]/30 uppercase tracking-widest mb-3">Select a date</p>
                  {/* Mobile: horizontal scroll */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
                    {[8,9,10,11,12,13,14,15].map(d => (
                      <div key={d} className={`flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl text-[10px] min-w-[40px] ${
                        d === 12 ? 'bg-[#0D7377] text-white' : 'bg-[#f9f7f3] text-[#1a1a1a]/60'
                      }`}>
                        <span className="uppercase">{['','','','','','W','T','F','S'][d] ?? 'M'}</span>
                        <span className="font-bold text-sm mt-0.5">{d}</span>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: calendar grid */}
                  <div className="hidden sm:block">
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
                </div>

                {/* Time slots */}
                <div className="sm:w-40 sm:flex-shrink-0">
                  <p className="text-[10px] font-semibold text-[#1a1a1a]/30 uppercase tracking-widest mb-3">Available</p>
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
                          ? 'border-[#0D7377]/40 bg-[#0D7377]/8 text-[#0D7377] font-medium'
                          : 'border-[#1a1a1a]/08 text-[#1a1a1a]/50'
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
      <section className="py-12 sm:py-16 border-y border-[#1a1a1a]/[0.06] bg-white/50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
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
      <section id="features" className="py-20 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Everything you need for seamless team scheduling
            </h2>
            <p className="text-lg text-[#1a1a1a]/40 max-w-2xl mx-auto">Built for teams who actually want to keep their customers happy.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '👥',
                title: 'Personal & team links',
                desc: 'Solo scheduling or team routing. One link for your entire team — CalRoute automatically routes each meeting to whoever is actually free.'
              },
              {
                icon: '📅',
                title: 'Multi-calendar merging',
                desc: 'Each team member connects up to 5 calendars. Work, personal, side projects — all merged into one honest view.'
              },
              {
                icon: '🎯',
                title: 'Smart routing',
                desc: 'Round-robin, priority-based, or first-available. Set it once and let CalRoute assign automatically.'
              },
              {
                icon: '📍',
                title: 'Real-time availability',
                desc: 'Live team status showing who is available right now or already in a meeting. Makes scheduling feel instant.'
              },
              {
                icon: '⏰',
                title: 'Timezone intelligence',
                desc: 'Customers book in their timezone. Your team sees their own. No more "which timezone?" confusion.'
              },
              {
                icon: '📞',
                title: 'Phone call meetings',
                desc: 'Offer phone calls instead of video. Customers enter their number, team gets it in confirmation emails.'
              },
              {
                icon: '🌐',
                title: 'Language-based selection',
                desc: 'For global teams, customers pick their language. CalRoute shows only hosts who speak it.'
              },
              {
                icon: '🔄',
                title: 'Guest rescheduling & cancellation',
                desc: 'Customers self-serve to reschedule or cancel up to 24h before. Real-time notifications to your team.'
              },
              {
                icon: '📧',
                title: 'Custom email templates',
                desc: 'Brand your booking confirmations and reminders. Use variables like {{customer_name}} and {{meeting_time}}.'
              },
              {
                icon: '🎣',
                title: 'Webhooks & API',
                desc: 'Get real-time booking events via webhooks. Build on top with our full REST API. HMAC-signed for security.'
              },
              {
                icon: '📱',
                title: 'Mobile-first design',
                desc: 'Responsive month-calendar with touch-friendly interactions. Works perfectly on any device.'
              },
              {
                icon: '🔗',
                title: 'Embeddable everywhere',
                desc: 'Drop one iframe into your website, Notion, or email. The booking widget appears inline — zero redirects.'
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-3xl p-8 border border-[#1a1a1a]/[0.06] hover:border-[#0D7377]/30 hover:shadow-lg hover:shadow-[#0D7377]/[0.08] transition-all duration-300 group">
                <div className="w-12 h-12 bg-[#0D7377]/10 rounded-2xl flex items-center justify-center text-xl mb-5 group-hover:bg-[#0D7377]/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold mb-3 group-hover:text-[#0D7377] transition-colors">{f.title}</h3>
                <p className="text-sm text-[#1a1a1a]/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 sm:py-32 px-6 bg-white/60 border-t border-[#1a1a1a]/[0.06]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-10 sm:mb-16 leading-tight">Up and running in under 2 minutes</h2>

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
      <section className="py-20 sm:py-32 px-6 border-t border-[#1a1a1a]/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">Why CalRoute</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">Built for teams, not individuals.</h2>
            <p className="text-lg text-[#1a1a1a]/40">We did what other scheduling tools left unfinished.</p>
          </div>

          <div className="rounded-3xl border border-[#1a1a1a]/[0.08] overflow-hidden bg-white shadow-lg shadow-[#1a1a1a]/[0.04]">
            <div className="grid grid-cols-2 border-b border-[#1a1a1a]/[0.08] bg-[#f9f7f3]">
              <div className="px-6 sm:px-8 py-4 text-xs font-semibold text-[#1a1a1a]/40 uppercase tracking-wider border-r border-[#1a1a1a]/[0.08]">Standard solutions</div>
              <div className="px-6 sm:px-8 py-4 text-xs font-semibold text-[#0D7377] uppercase tracking-wider">CalRoute</div>
            </div>
            {[
              { them: 'One calendar per person', us: 'Up to 5 calendars merged per person' },
              { them: 'Manual round-robin setup', us: 'Automatic routing, configured in seconds' },
              { them: 'Stale availability info', us: 'Real-time availability status for your team' },
              { them: 'No phone call support', us: 'Phone calls or video — switch anytime' },
              { them: 'Static confirmation emails', us: 'Custom branded email templates' },
              { them: 'No API access', us: 'Full REST API + webhooks for integrations' },
              { them: 'Per-seat pricing', us: 'From $10/mo — not $10 per person' },
              { them: 'Redirect to external page', us: 'Embed directly on your website' },
            ].map((r, i) => (
              <div key={i} className={`grid grid-cols-2 text-xs sm:text-sm ${i < 5 ? 'border-b border-[#1a1a1a]/[0.08]' : ''}`}>
                <div className="px-6 sm:px-8 py-4 sm:py-5 text-[#1a1a1a]/40 flex items-start sm:items-center gap-3 border-r border-[#1a1a1a]/[0.08]">
                  <span className="text-[#1a1a1a]/15 flex-shrink-0 mt-0.5 sm:mt-0 text-lg">✕</span>
                  <span>{r.them}</span>
                </div>
                <div className="px-6 sm:px-8 py-4 sm:py-5 text-[#1a1a1a]/70 flex items-start sm:items-center gap-3 bg-[#0D7377]/[0.03]">
                  <span className="text-[#0D7377] flex-shrink-0 mt-0.5 sm:mt-0 text-lg font-bold">✓</span>
                  <span className="text-[#1a1a1a]/80">{r.us}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-32 px-6 border-t border-[#1a1a1a]/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-[#0D7377] font-semibold uppercase tracking-widest mb-4">Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">Simple pricing that scales.</h2>
            <p className="text-lg text-[#1a1a1a]/40">Start free. Upgrade only when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Free Card */}
            <div className="bg-white rounded-3xl p-8 border border-[#1a1a1a]/[0.06] hover:border-[#0D7377]/30 hover:shadow-lg hover:shadow-[#0D7377]/[0.08] transition-all">
              <p className="font-semibold text-gray-900 mb-1">Free</p>
              <p className="text-sm text-gray-500 mb-4">Get started, no card needed</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#1a1a1a]">$0</span>
                <span className="text-gray-500 text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-[#1a1a1a]/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>1 booking link</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Unlimited bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Phone + video meetings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Google Calendar sync</span>
                </li>
              </ul>
              <Link
                href="/login"
                className="w-full inline-block text-center bg-[#0D7377] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#0a5f63] transition-colors"
              >
                Start for free →
              </Link>
            </div>

            {/* Solo Card (Most Popular) */}
            <div className="bg-white rounded-3xl p-8 border border-[#0D7377]/40 shadow-lg shadow-[#0D7377]/[0.08] relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="inline-flex items-center gap-2 border border-[#0D7377]/20 bg-[#0D7377]/8 text-[#0D7377] text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#0D7377] rounded-full" />
                  Most popular
                </div>
              </div>
              <p className="font-semibold text-gray-900 mb-1">Solo</p>
              <p className="text-sm text-gray-500 mb-4">Everything you need, one flat rate</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#1a1a1a]">$10</span>
                <span className="text-gray-500 text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-[#1a1a1a]/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Unlimited booking links</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Custom email templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Full analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Webhooks & REST API</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Phone & email support</span>
                </li>
              </ul>
              <Link
                href="/login"
                className="w-full inline-block text-center bg-[#0D7377] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#0a5f63] transition-colors"
              >
                Get Solo →
              </Link>
            </div>

            {/* Team Card */}
            <div className="bg-white rounded-3xl p-8 border border-[#1a1a1a]/[0.06] hover:border-[#0D7377]/30 hover:shadow-lg hover:shadow-[#0D7377]/[0.08] transition-all">
              <p className="font-semibold text-gray-900 mb-1">Team</p>
              <p className="text-sm text-gray-500 mb-4">Built for routing pools and shared calendars</p>
              <div className="mb-6">
                <div>
                  <span className="text-3xl font-bold text-[#1a1a1a]">$10</span>
                  <span className="text-gray-500 text-sm ml-2">/ month base</span>
                </div>
                <div className="mt-1 text-sm text-gray-500">+ $2 per seat</div>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-[#1a1a1a]/70">
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Everything in Solo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Multi-host booking links</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Round-robin & priority routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>Real-time team availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#0D7377] font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span>50% off Solo for team members</span>
                </li>
              </ul>
              <Link
                href="/login"
                className="w-full inline-block text-center bg-[#0D7377] text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[#0a5f63] transition-colors"
              >
                Get Team →
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-[#1a1a1a]/40">All plans include a 14-day free trial. No credit card required to start.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32 px-6 bg-gradient-to-b from-[#0D7377] to-[#0a5f63] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">Ready to get your team synced?</h2>
          <p className="text-white/70 text-xl mb-3">Stop email ping-pong. Start working.</p>
          <p className="text-white/50 text-lg mb-12">14-day free trial. No credit card required.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white text-[#0D7377] font-bold text-lg px-12 py-4 rounded-xl hover:bg-[#F7F4EF] transition-all shadow-2xl shadow-black/20 hover:shadow-2xl hover:shadow-white/30"
          >
            Create your booking link →
          </Link>
          <p className="text-white/40 text-sm mt-8">Takes under 2 minutes. Free trial included.</p>
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
            <a href="#pricing" className="hover:text-[#0D7377] transition-colors">Pricing</a>
            <Link href="/privacy" className="hover:text-[#0D7377] transition-colors">Privacy</Link>
            <Link href="/login" className="hover:text-[#0D7377] transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}

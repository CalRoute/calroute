import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

export const metadata = {
  title: 'Terms of Service — CalRoute',
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF]">
      <PublicHeader />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-[#1a1a1a]/40 mb-12">Last updated: May 31, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[#1a1a1a]/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">Welcome to CalRoute</h2>
            <p>Please read these Terms of Service ("Terms") carefully before using our platform, API, web dashboard, or embeddable scheduling widgets (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">1. Description of Service</h2>
            <p>CalRoute provides an automated, multi-calendar scheduling and routing infrastructure. The Service aggregates availability across multiple third-party accounts (such as Google Calendar) to distribute and optimize meeting slot allocation for individuals and teams based on priority rules.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">2. Account Registration & Third-Party Integrations</h2>

            <div className="mb-4">
              <h3 className="font-semibold text-[#1a1a1a] mb-2">Account Security</h3>
              <p>To use the Service, you must register for an account and maintain the security of your access credentials. You are entirely responsible for all activities that occur under your account.</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-[#1a1a1a] mb-2">Calendar Connectivity</h3>
              <p>The Service requires read and write access permissions to your connected third-party calendar accounts (e.g., Google OAuth tokens). You represent and warrant that you have the explicit legal authority and corporate permission to connect all integrated calendars (including corporate or enterprise calendars) to the Service.</p>
            </div>

            <div>
              <h3 className="font-semibold text-[#1a1a1a] mb-2">Third-Party Failures</h3>
              <p>CalRoute relies on third-party APIs. We are not responsible or liable for any downtime, API deprecations, data synchronization delays, or service interruptions caused directly by external providers like Google.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">3. Acceptable Use & API Rate Limits</h2>
            <p className="mb-4">You agree not to abuse the Service, its infrastructure, or its widgets. Prohibited actions include, but are not limited to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Reverse-engineering or scraping CalRoute's edge API endpoints or internal application systems</li>
              <li>Injecting malicious code, spamming reservations via our scheduling paths, or intentionally overwhelming the reservation engine (/api/slots/reserve)</li>
              <li>Utilizing the embeddable widgets (embed.js) on websites hosting illegal, fraudulent, or malicious content</li>
            </ul>
            <p className="mt-4">We reserve the right to immediately suspend or permanently terminate access for accounts that violate these guidelines or exhibit unusual volume spikes that endanger our system's stability.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">4. Limitation of Liability</h2>
            <p className="mb-3 font-semibold text-[#1a1a1a]">THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.</p>
            <p className="mb-4">To the maximum extent permitted by applicable law, CalRoute, its founders, and contributors shall not be liable for any indirect, incidental, special, exemplary, or consequential damages. This includes, without limitation:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Lost profits, business opportunities, or revenue resulting from missed meetings or scheduling conflicts</li>
              <li>Platform downtime, double-bookings, or automated sync glitches</li>
              <li>Unauthorized modification, access, or deletion of calendar events handled through our system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">5. Modification of Terms</h2>
            <p>We reserve the right to modify these Terms at any time. Changes will become effective immediately upon posting to this page. Continued use of the Service after changes are published constitutes your explicit acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">6. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada, without regard to its conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">7. Webhooks, APIs, and Custom Content</h2>
            <p className="mb-3"><strong className="text-[#1a1a1a]">Webhooks:</strong> If you enable webhooks, CalRoute will send booking event data to your specified endpoint. You are responsible for securing your endpoint and handling the data according to your privacy obligations.</p>
            <p className="mb-3"><strong className="text-[#1a1a1a]">API Keys:</strong> API keys provide programmatic access to your CalRoute data. Keep your keys private. You are liable for any use of your keys.</p>
            <p><strong className="text-[#1a1a1a]">Custom Email Templates:</strong> You may customize booking confirmation, cancellation, and reschedule emails. You are responsible for ensuring your custom content complies with applicable laws and does not infringe third-party rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">8. Privacy</h2>
            <p>Your use of CalRoute is also governed by our <Link href="/privacy" className="text-[#0D7377] underline">Privacy Policy</Link>, which explains how we collect, use, and protect your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">9. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:info@calroute.me" className="text-[#0D7377] underline">info@calroute.me</a></p>
          </section>

        </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'

export const metadata = {
  title: 'Privacy Policy | CalRoute',
}

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF]">
      <PublicHeader />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#1a1a1a]/40 mb-12">Last updated: May 31, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[#1a1a1a]/70 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">1. Overview</h2>
            <p>CalRoute ("we", "us", or "our") operates calroute.me. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information. By using CalRoute, you agree to this policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">2. Information we collect</h2>
            <p className="mb-3"><strong className="text-[#1a1a1a]">Account information:</strong> When you sign in with Google, we receive your name, email address, and profile photo from Google.</p>
            <p className="mb-3"><strong className="text-[#1a1a1a]">Google Calendar data:</strong> With your explicit permission, CalRoute accesses your Google Calendar free/busy information to determine your availability. We do <strong className="text-[#1a1a1a]">not</strong> read, store, or process the titles, descriptions, or attendees of your calendar events. We only check whether a time slot is free or busy.</p>
            <p className="mb-3"><strong className="text-[#1a1a1a]">Booking information:</strong> When a customer books a meeting through CalRoute, we collect their name, email address, and any optional notes they provide. For phone call meetings, we also collect their phone number to facilitate the call.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">3. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To display your availability to people booking meetings with you</li>
              <li>To create Google Calendar events when a booking is confirmed</li>
              <li>To send confirmation emails to you and your customers</li>
              <li>To route bookings to the correct team member based on availability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">4. Google API data</h2>
            <p className="mb-3">CalRoute's use of Google Calendar data is limited to what is necessary to provide the scheduling service. Specifically:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>We use <strong className="text-[#1a1a1a]">read-only</strong> access to determine free/busy times</li>
              <li>We use write access only to create calendar events for confirmed bookings</li>
              <li>We do not share your Google data with any third parties</li>
              <li>We do not use your Google data for advertising or marketing</li>
              <li>Your Google OAuth tokens are stored securely and used solely to access your calendar on your behalf</li>
            </ul>
            <p className="mt-3">CalRoute's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-[#0D7377] underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">5. Data storage and security</h2>
            <p>Your data is stored in Google Firebase (Firestore), which is hosted in secure Google data centers. We use industry-standard encryption in transit (HTTPS) and at rest. OAuth tokens are stored encrypted and are used only to make calendar API requests on your behalf.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">6. Data retention</h2>
            <p>We retain your account data for as long as your account is active. Booking records are retained for 3 months. You may request deletion of your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">7. Third-party services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-[#1a1a1a]">Google Calendar API</strong>:reading availability and creating events</li>
              <li><strong className="text-[#1a1a1a]">Firebase / Firestore</strong>:authentication and data storage</li>
              <li><strong className="text-[#1a1a1a]">Resend</strong>:sending confirmation emails</li>
              <li><strong className="text-[#1a1a1a]">Vercel</strong>:hosting the application</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">8. Your rights</h2>
            <p>You may disconnect your Google Calendar at any time from the Settings page. You may also request access to, correction of, or deletion of your personal data by contacting us at the email below.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">9. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. Continued use of CalRoute after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">10. Terms of Service</h2>
            <p>This Privacy Policy is complementary to our <Link href="/terms" className="text-[#0D7377] underline">Terms of Service</Link>, which govern your use of CalRoute. Please review both documents to understand your rights and obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a] mb-3">11. Contact</h2>
            <p>For privacy-related questions or data requests, contact us at: <a href="mailto:info@calroute.me" className="text-[#0D7377] underline">info@calroute.me</a></p>
          </section>

        </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

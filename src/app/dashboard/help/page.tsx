import DashboardLayout from '@/components/DashboardLayout'
import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import FaqAccordion from './FaqAccordion'

export default async function HelpPage() {
  const user = await requireUser('/dashboard/help')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  const faqSections = [
    {
      title: 'Getting Started',
      questions: [
        {
          q: 'How do I create my first booking link?',
          a: 'Go to Dashboard > Links > Create new. Choose between a personal link (for you) or a team link (for multiple hosts). Set your meeting duration, buffer time, and routing strategy.',
        },
        {
          q: 'What is the difference between priority and round-robin routing?',
          a: 'Priority: assigns bookings to hosts based on their priority number (higher wins). Round-robin: alternates between hosts based on who was booked least recently.',
        },
        {
          q: 'Can I change my timezone?',
          a: 'Yes, go to Settings > Profile > Timezone. Your timezone is used to display meeting times and to determine availability windows.',
        },
        {
          q: 'How do I add team members to a booking link?',
          a: 'Go to the booking link settings and scroll to "Team members". Add members by email, set their priority level, and they\'ll receive invites to join CalRoute.',
        },
        {
          q: 'What does "smart" routing do?',
          a: 'Smart routing prioritizes hosts in the same timezone as the booking customer, with language matching as a secondary filter. Perfect for global teams.',
        },
      ],
    },
    {
      title: 'Booking Links',
      questions: [
        {
          q: 'What is a booking link slug?',
          a: 'The slug is the URL-friendly identifier. For example, slug "product-demo" creates the link calroute.me/book/product-demo. Slugs must be unique.',
        },
        {
          q: 'Can I customize my booking confirmation emails?',
          a: 'Yes, in the link settings under "Email templates", you can write custom HTML for confirmation, cancellation, and reschedule emails. Use {{variables}} like {{customerName}}, {{hostName}}, {{startTime}}.',
        },
        {
          q: 'What happens if I disable a booking link?',
          a: 'The link won\'t accept new bookings, but existing bookings remain. You can re-enable it anytime from Settings > Booking links.',
        },
        {
          q: 'Can guests reschedule or cancel their own bookings?',
          a: 'Yes! Every booking confirmation email includes "Reschedule" and "Cancel" links that guests can use without contacting you.',
        },
        {
          q: 'Can I set vacation or blackout dates?',
          a: 'Yes, go to Settings > Vacation dates and add date ranges when you\'re unavailable. Guests won\'t be able to book on those days.',
        },
        {
          q: 'How do I prevent back-to-back meetings?',
          a: 'In the link settings, set "Buffer after" (e.g., 15 minutes) to add a break after each meeting.',
        },
      ],
    },
    {
      title: 'Team Features',
      questions: [
        {
          q: 'How do I invite team members?',
          a: 'Go to Dashboard > Team, find the link, and click "Invite". Copy the booking link and share it with colleagues. They\'ll join as team members with their own calendars connected.',
        },
        {
          q: 'What does the green/amber status dot mean?',
          a: 'Green = availability is set up and a calendar is connected. Amber = availability or calendar setup is incomplete.',
        },
        {
          q: 'Can I see how many bookings each team member has handled?',
          a: 'Yes, on the Team page you\'ll see booking count, availability days, and role (Owner/Member) for each team member.',
        },
        {
          q: 'Can I set different availability for different team members?',
          a: 'Each team member sets their own availability in their Settings. You can also set per-link working hours if needed.',
        },
        {
          q: 'What timezone is shown for team members?',
          a: 'Each team member\'s timezone (from their Settings) is displayed on the Team page, helping you coordinate across zones.',
        },
      ],
    },
    {
      title: 'Calendars & Availability',
      questions: [
        {
          q: 'Which calendars can I connect?',
          a: 'CalRoute supports Google Calendar. You can connect up to 5 calendars per account. All connected calendars are checked for availability.',
        },
        {
          q: 'How often is my calendar updated?',
          a: 'Calendar data is fetched in real-time when someone views your availability. This ensures the most up-to-date free/busy info.',
        },
        {
          q: 'What if I don\'t connect a calendar?',
          a: 'You can still manually set your availability in Settings > Availability. Calendar data and manual availability are combined.',
        },
        {
          q: 'Can I set different availability for different booking links?',
          a: 'Currently, availability is global per host. If you need link-specific rules, you can manage that through your calendar.',
        },
      ],
    },
    {
      title: 'Integrations & Advanced',
      questions: [
        {
          q: 'Can I receive webhooks when bookings happen?',
          a: 'Yes, go to Integrations > Webhooks and create a webhook endpoint. You\'ll receive real-time POST requests for booking.confirmed, booking.cancelled, and booking.rescheduled events.',
        },
        {
          q: 'Do you have an API?',
          a: 'Yes! Go to Settings > API Keys to generate API keys for programmatic access to CalRoute data.',
        },
        {
          q: 'Can I integrate with Slack or Zapier?',
          a: 'You can use webhooks to trigger Zapier automations. Slack integration coming soon.',
        },
        {
          q: 'How do I export my booking data?',
          a: 'Go to Dashboard > Analytics and click "Export CSV" to download booking data. Bookings page also supports CSV export of filtered data.',
        },
      ],
    },
    {
      title: 'Troubleshooting',
      questions: [
        {
          q: 'Why is no one seeing available times?',
          a: 'Check that: (1) Your availability is set in Settings, (2) A calendar is connected, (3) The link is active, (4) No vacation dates block the requested time.',
        },
        {
          q: 'Why is my booking link disabled?',
          a: 'It may have been manually deactivated. Go to Settings > Booking links and click "Activate".',
        },
        {
          q: 'Can I change my email address?',
          a: 'Your email is tied to your account. Contact support to change it.',
        },
        {
          q: 'How do I delete my account?',
          a: 'Contact support at hello@calroute.me with a request. We\'ll guide you through the process.',
        },
        {
          q: 'Who do I contact for support?',
          a: 'Email hello@calroute.me or open an issue on GitHub: github.com/anthropics/calroute. Response time is typically 24-48 hours.',
        },
      ],
    },
  ]

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Help' }]}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & FAQ</h1>
          <p className="text-gray-600 mt-2">Answers to common questions about CalRoute</p>
        </div>

        <div className="space-y-8">
          {faqSections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
              <FaqAccordion questions={section.questions} />
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
          <p className="text-sm text-blue-900">
            <strong>Can't find what you're looking for?</strong> Open an issue on{' '}
            <a
              href="https://github.com/anthropics/calroute/issues"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub
            </a>{' '}
            or email hello@calroute.me
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

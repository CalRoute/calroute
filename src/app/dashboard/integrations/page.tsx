export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import DashboardLayout from '@/components/DashboardLayout'
import WebhooksManager from './WebhooksManager'
import TrelloConnector from './TrelloConnector'

export default async function IntegrationsPage() {
  const user = await requireUser('/dashboard/integrations')

  const hostSnap = await adminDb.collection('hosts').doc(user.uid).get()
  const host = hostSnap.data()

  const webhooksSnap = await adminDb
    .collection('hosts')
    .doc(user.uid)
    .collection('webhooks')
    .get()

  const webhooks = webhooksSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as any[]

  return (
    <DashboardLayout
      user={{ email: user.email, name: host?.name }}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Integrations' }]}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">Connect CalRoute with your tools and workflows</p>
        </div>

        {/* Webhooks */}
        <WebhooksManager webhooks={webhooks} />

        {/* Trello Integration */}
        <TrelloConnector />

        {/* Available via Webhooks */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available via Webhooks</h2>
          <p className="text-sm text-gray-600 mb-6">Create a webhook above, then connect it to these platforms to automate your workflow.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: 'Zapier',
                description: 'Connect to 5000+ apps. Use webhook trigger to start Zaps on bookings.',
                icon: '⚡',
                link: 'https://zapier.com/apps/webhooks/integrations'
              },
              {
                name: 'Make (Integromat)',
                description: 'Automate workflows across 1000+ apps using webhook triggers.',
                icon: '🔄',
                link: 'https://www.make.com/en/help/app/webhooks'
              },
              {
                name: 'IFTTT',
                description: 'Use webhook applets to trigger actions across connected services.',
                icon: '🎯',
                link: 'https://ifttt.com/explore/webhooks'
              },
            ].map((integration) => (
              <a
                key={integration.name}
                href={integration.link}
                target="_blank"
                rel="noreferrer"
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#0D7377] hover:shadow-lg transition-all group"
              >
                <div className="text-3xl mb-3">{integration.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#0D7377]">{integration.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                <button className="px-4 py-2 text-sm text-[#0D7377] bg-[#0D7377]/10 rounded-lg hover:bg-[#0D7377]/20 transition-colors">
                  Learn more →
                </button>
              </a>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { name: 'Slack', description: 'Get notified in Slack when bookings happen', icon: '💬' },
            ].map((integration) => (
              <div key={integration.name} className="bg-white rounded-2xl border border-gray-200 p-6 opacity-60">
                <div className="text-3xl mb-3">{integration.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                <button disabled className="px-4 py-2 text-sm text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
                  Coming soon
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

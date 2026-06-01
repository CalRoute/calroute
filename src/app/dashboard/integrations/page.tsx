export const dynamic = 'force-dynamic'

import { requireUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import DashboardLayout from '@/components/DashboardLayout'
import WebhooksManager from './WebhooksManager'

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

        {/* Coming Soon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Slack', description: 'Get notified in Slack when bookings happen', icon: '💬' },
            { name: 'Zapier', description: 'Connect to 5000+ apps via Zapier', icon: '⚡' },
            { name: 'Make (Integromat)', description: 'Automate workflows with Make', icon: '🔄' },
            { name: 'IFTTT', description: 'If This Then That automations', icon: '🎯' },
          ].map((integration) => (
            <div key={integration.name} className="bg-white rounded-2xl border border-gray-200 p-6 opacity-50">
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
    </DashboardLayout>
  )
}

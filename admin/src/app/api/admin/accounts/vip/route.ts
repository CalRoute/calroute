import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { adminDb } from '@/lib/firebase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST { uid, grant: true|false }
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { uid, grant } = await request.json()
  if (!uid || typeof grant !== 'boolean') {
    return Response.json({ error: 'uid and grant (boolean) required' }, { status: 400 })
  }

  try {
    const [billingRef, hostSnap] = [
      adminDb.collection('hosts').doc(uid).collection('billing').doc('status'),
      await adminDb.collection('hosts').doc(uid).get(),
    ]
    const host = hostSnap.data()

    if (grant) {
      await billingRef.set({
        tier: 'vip',
        status: 'active',
        subscriptionId: null,
        stripeCustomerId: null,
        teamId: null,
      }, { merge: true })
    } else {
      await billingRef.set({
        tier: 'free_trial',
        status: 'trialing',
        subscriptionId: null,
        stripeCustomerId: null,
        teamId: null,
      }, { merge: true })
    }

    // Notify the user
    if (host?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!
      const firstName = host.name?.split(' ')[0] ?? 'there'
      const subject = grant ? `${firstName}, you're a VIP now ⭐` : 'A quick note about your CalRoute account'
      const html = grant
        ? `<p>Hey ${firstName}! 🎉</p><p>We've upgraded your account to full VIP access — completely on us. Unlimited booking links, API access, team features, everything. No catch, no expiry. Just enjoy it!</p><p><a href="${appUrl}/dashboard">Go explore →</a></p><p style="color:#888;font-size:13px;">Questions? Just reply to this email.</p>`
        : `<p>Hey ${firstName},</p><p>Just a heads up — your complimentary VIP access has been removed and your account is back on the free trial. If you'd like to keep full access, upgrading is quick and easy.</p><p><a href="${appUrl}/dashboard/settings?tab=billing">See plans →</a></p><p style="color:#888;font-size:13px;">Have questions? Reply here and we'll help you out.</p>`

      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: host.email,
        subject,
        html,
      }).catch(e => console.error('[vip-email] failed:', e))
    }

    return Response.json({ ok: true, uid, vip: grant })
  } catch (error) {
    console.error('[vip] error:', error)
    return Response.json({ error: 'Failed to update VIP status' }, { status: 500 })
  }
}

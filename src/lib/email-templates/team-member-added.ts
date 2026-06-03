import { emailLayout } from './layout'

interface TeamMemberAddedData {
  memberName: string
  ownerName: string
  linkTitle: string
  settingsUrl: string
}

export function teamMemberAddedEmail(data: TeamMemberAddedData): string {
  const { memberName, ownerName, linkTitle, settingsUrl } = data

  const content = `
    <h2>${ownerName} added you to CalRoute</h2>
    <p>Hi ${memberName},</p>
    <p><strong>${ownerName}</strong> just added you as a host to their <strong>"${linkTitle}"</strong> booking link. You're now part of their premium CalRoute team.</p>
    <h3>What this means:</h3>
    <ul>
      <li>You can now receive bookings through their link automatically</li>
      <li>Your availability is synchronized with their team schedule</li>
      <li>You have full access to CalRoute's pro features at no extra cost to you</li>
    </ul>
    <h3>Next steps:</h3>
    <p>You can also get your own Solo plan (unlimited personal links, analytics, API access) for <strong>just $5/month</strong> — that's 50% off the regular $10/month price. Upgrade from your <a href="${settingsUrl}">settings page</a>.</p>
    <p><a href="${settingsUrl}"><strong>Go to your settings →</strong></a></p>
    <hr />
    <p style="font-size: 12px; color: #999; margin-top: 32px;">Questions? Reply to this email or visit <a href="https://calroute.me/support">our support page</a>.</p>
  `

  return emailLayout(content)
}

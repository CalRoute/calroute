import { emailLayout } from './layout'

export function trialEndingEmail(data: {
  name: string
  daysLeft: number
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const isToday = data.daysLeft <= 1
  const subject = isToday
    ? `${firstName}, your CalRoute trial ends today`
    : `${firstName}, your CalRoute trial ends in ${data.daysLeft} days`

  const content = isToday ? `
    <h2>Today's the last day of your trial, ${firstName}</h2>
    <p>Your free trial ends today. If you'd like to keep everything going — unlimited booking links, API access, the works — upgrading takes about 30 seconds.</p>
    <a class="button" href="${data.appUrl}/dashboard/settings?tab=billing">Upgrade now →</a>
    <hr />
    <p class="actions">Not ready? No pressure. Your data won't disappear right away. Reply if you have questions.</p>
  ` : `
    <h2>Heads up, ${firstName} — ${data.daysLeft} days left on your trial</h2>
    <p>Just a friendly reminder that your CalRoute free trial ends in ${data.daysLeft} days. After that, you'll need a plan to keep unlimited booking links and all the features.</p>
    <table class="details">
      <tr><td class="label">Solo</td><td class="value">$10/month — unlimited links, API, webhooks</td></tr>
      <tr><td class="label">Team</td><td class="value">Includes team routing, round-robin, and member management</td></tr>
    </table>
    <a class="button" href="${data.appUrl}/dashboard/settings?tab=billing">Pick a plan →</a>
    <hr />
    <p class="actions">Questions about which plan is right for you? Just reply — we'll help you figure it out.</p>
  `
  return emailLayout(content, subject)
}

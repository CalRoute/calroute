import { emailLayout } from './layout'

export function vacationEndedEmail(data: {
  name: string
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const content = `
    <h2>Welcome back, ${firstName}! 🎉</h2>
    <p>Your blackout period is over — guests can book time with you again starting today.</p>
    <p>Hope you had a great break. Your booking links are back to normal, no action needed on your end.</p>
    <a class="button" href="${data.appUrl}/dashboard">See your dashboard →</a>
  `
  return emailLayout(content, `You're back, ${firstName}!`)
}

export function vacationSetEmail(data: {
  name: string
  dates: { startDate: string; endDate: string; reason?: string | null }[]
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const dateRows = data.dates.map(d => {
    const start = new Date(d.startDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    const end = new Date(d.endDate).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
    const label = start === end ? start : `${start} – ${end}`
    return `<tr><td class="label">${label}</td><td class="value">${d.reason || 'Blocked'}</td></tr>`
  }).join('')

  const content = `
    <h2>All set, ${firstName}! Your time off is blocked. ✈️</h2>
    <p>Guests won't be able to book you during these periods:</p>
    <table class="details">
      ${dateRows}
    </table>
    <p>Need to make changes? You can update your blackout dates anytime from your settings.</p>
    <a class="button" href="${data.appUrl}/dashboard/settings?tab=availability">Manage availability →</a>
  `
  return emailLayout(content, 'Your blackout dates are saved — enjoy your time off!')
}

import { emailLayout } from './layout'
import { formatTimeInTimezone } from '@/lib/format-time'

export function bookingRescheduledGuestEmail(data: {
  title: string
  hostName: string
  newStartTime: Date
  durationMinutes: number
  timezone: string
  rescheduleUrl: string
  cancelUrl: string
  meetingType?: 'google_meet' | 'phone_call' | 'in_person'
  meetingLocation?: string
}): string {
  const whenText = formatTimeInTimezone(data.newStartTime, data.timezone)
  const locationNote = data.meetingType === 'in_person'
    ? `<p>📍 Location: <strong>${data.meetingLocation || 'In person (your host will confirm the address)'}</strong></p>`
    : data.meetingType === 'phone_call'
      ? `<p>Your host will call you at the number you provided.</p>`
      : `<p>Your calendar invite has been updated with the new time.</p>`

  const content = `
    <h2>Your meeting has been rescheduled</h2>
    <table class="details">
      <tr><td class="label">What</td><td class="value">${data.title}</td></tr>
      <tr><td class="label">New time</td><td class="value">${whenText}</td></tr>
      <tr><td class="label">Duration</td><td class="value">${data.durationMinutes} minutes</td></tr>
      <tr><td class="label">With</td><td class="value">${data.hostName}</td></tr>
    </table>
    ${locationNote}
    <hr />
    <p class="actions">
      Need to change again? You can
      <a href="${data.rescheduleUrl}">reschedule</a> or
      <a href="${data.cancelUrl}">cancel</a> up to 24 hours before the meeting.
    </p>
  `
  return emailLayout(content, `Your meeting with ${data.hostName} has moved to ${whenText}`)
}

export function bookingRescheduledHostEmail(data: {
  title: string
  customerName: string
  customerEmail: string
  newStartTime: Date
  previousStartTime: Date
  timezone: string
}): string {
  const content = `
    <h2>A meeting has been rescheduled</h2>
    <ul>
      <li><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</li>
      <li><strong>Meeting:</strong> ${data.title}</li>
      <li><strong>New time:</strong> ${formatTimeInTimezone(data.newStartTime, data.timezone)}</li>
      <li><strong>Previous time:</strong> ${formatTimeInTimezone(data.previousStartTime, data.timezone)}</li>
    </ul>
    <p>Your calendar has been updated.</p>
  `
  return emailLayout(content)
}

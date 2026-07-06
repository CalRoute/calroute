import { emailLayout } from './layout'
import { formatTimeInTimezone } from '@/lib/format-time'

export function bookingReminderGuestEmail(data: {
  title: string
  hostName: string
  startTime: Date
  durationMinutes: number
  timezone: string
  meetingType?: 'google_meet' | 'phone_call' | 'in_person'
  meetLink?: string | null
  meetingLocation?: string
  cancelUrl: string
  rescheduleUrl: string
}): string {
  const whenText = formatTimeInTimezone(data.startTime, data.timezone)

  const locationNote = data.meetingType === 'phone_call'
    ? `<p>${data.hostName} will call you at the number you provided. Make sure you're available! 📞</p>`
    : data.meetingType === 'in_person'
      ? `<p>📍 You're meeting in person at: <strong>${data.meetingLocation || 'your host will confirm the address'}</strong></p>`
      : data.meetLink
        ? `<a class="button" href="${data.meetLink}">Join Google Meet →</a>`
        : `<p>Your calendar invite has the Google Meet link. See you there!</p>`

  const content = `
    <h2>Just a reminder, you have a meeting tomorrow! 👋</h2>
    <table class="details">
      <tr><td class="label">What</td><td class="value">${data.title}</td></tr>
      <tr><td class="label">When</td><td class="value">${whenText}</td></tr>
      <tr><td class="label">How long</td><td class="value">${data.durationMinutes} minutes</td></tr>
      <tr><td class="label">With</td><td class="value">${data.hostName}</td></tr>
    </table>
    ${locationNote}
    <hr />
    <p class="actions">Plans changed? You can <a href="${data.rescheduleUrl}">reschedule</a> or <a href="${data.cancelUrl}">cancel</a> up to 24 hours before the meeting.</p>
  `
  return emailLayout(content, `Don't forget! ${data.title} is tomorrow.`)
}

export function bookingReminderHostEmail(data: {
  title: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  startTime: Date
  durationMinutes: number
  timezone: string
  meetingType?: 'google_meet' | 'phone_call' | 'in_person'
  meetLink?: string | null
  meetingLocation?: string
}): string {
  const whenText = formatTimeInTimezone(data.startTime, data.timezone)

  const locationNote = data.meetingType === 'phone_call'
    ? `<p>Remember to call ${data.customerName}${data.customerPhone ? ` at <strong>${data.customerPhone}</strong>` : ''} when the time comes. 📞</p>`
    : data.meetingType === 'in_person'
      ? `<p>📍 Meeting in person at: <strong>${data.meetingLocation || 'in person'}</strong></p>`
      : data.meetLink
        ? `<a class="button" href="${data.meetLink}">Join Google Meet →</a>`
        : `<p>Check your calendar for the Google Meet link.</p>`

  const content = `
    <h2>You've got a meeting tomorrow! 📅</h2>
    <table class="details">
      <tr><td class="label">What</td><td class="value">${data.title}</td></tr>
      <tr><td class="label">When</td><td class="value">${whenText}</td></tr>
      <tr><td class="label">How long</td><td class="value">${data.durationMinutes} minutes</td></tr>
      <tr><td class="label">With</td><td class="value">${data.customerName} (${data.customerEmail})</td></tr>
    </table>
    ${locationNote}
  `
  return emailLayout(content, `Tomorrow: ${data.title} with ${data.customerName}`)
}

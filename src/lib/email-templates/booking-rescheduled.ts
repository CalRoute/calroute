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
}): string {
  const content = `
    <h2>Your meeting has been rescheduled</h2>
    <ul>
      <li><strong>What:</strong> ${data.title}</li>
      <li><strong>New time:</strong> ${formatTimeInTimezone(data.newStartTime, data.timezone)}</li>
      <li><strong>Duration:</strong> ${data.durationMinutes} minutes</li>
      <li><strong>With:</strong> ${data.hostName}</li>
    </ul>
    <p>Your calendar invite has been updated.</p>
    <hr />
    <p style="font-size: 13px; color: #666;">
      Need to change again? You can
      <a href="${data.rescheduleUrl}">reschedule</a> or
      <a href="${data.cancelUrl}">cancel</a> up to 24 hours before the meeting.
    </p>
  `
  return emailLayout(content)
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

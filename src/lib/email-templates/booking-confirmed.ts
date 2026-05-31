import { emailLayout } from './layout'
import { formatTimeInTimezone } from '@/lib/format-time'

export function bookingConfirmedEmail(data: {
  title: string
  customerName: string
  hostName: string
  startTime: Date
  durationMinutes: number
  timezone: string
  rescheduleUrl: string
  cancelUrl: string
}): string {
  const content = `
    <h2>Your meeting is confirmed!</h2>
    <ul>
      <li><strong>What:</strong> ${data.title}</li>
      <li><strong>When:</strong> ${formatTimeInTimezone(data.startTime, data.timezone)}</li>
      <li><strong>Duration:</strong> ${data.durationMinutes} minutes</li>
      <li><strong>With:</strong> ${data.hostName}</li>
    </ul>
    <p>A Google Meet link is in your calendar invite.</p>
    <hr />
    <p style="font-size: 13px; color: #666;">
      Need to make a change? You can
      <a href="${data.rescheduleUrl}">reschedule</a> or
      <a href="${data.cancelUrl}">cancel</a> up to 24 hours before the meeting.
    </p>
  `
  return emailLayout(content)
}

export function bookingConfirmedHostEmail(data: {
  title: string
  customerName: string
  customerEmail: string
  customerNotes?: string
  startTime: Date
}): string {
  const content = `
    <h2>New booking received</h2>
    <ul>
      <li><strong>Meeting:</strong> ${data.title}</li>
      <li><strong>When:</strong> ${data.startTime.toLocaleString()}</li>
      <li><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</li>
      ${data.customerNotes ? `<li><strong>Notes:</strong> ${data.customerNotes}</li>` : ''}
    </ul>
    <p>Check your calendar for the invite.</p>
  `
  return emailLayout(content)
}

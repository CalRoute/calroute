import { emailLayout } from './layout'
import { formatTimeInTimezone } from '@/lib/format-time'

export function bookingConfirmedEmail(data: {
  title: string
  customerName: string
  hostName: string
  hostEmail?: string
  startTime: Date
  durationMinutes: number
  timezone: string
  rescheduleUrl: string
  cancelUrl: string
  meetingType?: 'google_meet' | 'phone_call'
  customerPhone?: string
  meetLink?: string | null
  greeting?: string
  customerNotes?: string
}): string {
  const whenText = formatTimeInTimezone(data.startTime, data.timezone)
  const firstName = data.customerName.split(' ')[0]

  const locationRow = data.meetingType === 'phone_call'
    ? `<tr><td class="label">Where</td><td class="value">${data.hostName} will call you${data.customerPhone ? ` at ${data.customerPhone}` : ''}</td></tr>`
    : data.meetLink
      ? `<tr><td class="label">Where</td><td class="value"><a href="${data.meetLink}">${data.meetLink}</a></td></tr>`
      : `<tr><td class="label">Where</td><td class="value">Google Meet link in your calendar invite</td></tr>`

  const content = `
    <h2>You're booked with ${data.hostName} 🎉</h2>
    <p>Hi ${firstName}, your meeting is confirmed. Here are the details:</p>
    ${data.greeting ? `<div class="greeting">${data.greeting}</div>` : ''}
    <table class="details">
      <tr><td class="label">What</td><td class="value">${data.title}</td></tr>
      <tr><td class="label">When</td><td class="value">${whenText}</td></tr>
      <tr><td class="label">Duration</td><td class="value">${data.durationMinutes} minutes</td></tr>
      ${locationRow}
      ${data.hostEmail ? `<tr><td class="label">Host</td><td class="value">${data.hostName} (<a href="mailto:${data.hostEmail}">${data.hostEmail}</a>)</td></tr>` : ''}
      ${data.customerNotes ? `<tr><td class="label">Your notes</td><td class="value">${data.customerNotes}</td></tr>` : ''}
    </table>
    ${data.meetingType !== 'phone_call' && data.meetLink ? `<a class="button" href="${data.meetLink}">Join Google Meet</a>` : ''}
    <hr />
    <p class="actions">
      Need to make a change? You can
      <a href="${data.rescheduleUrl}">reschedule</a> or
      <a href="${data.cancelUrl}">cancel</a> up to 24 hours before the meeting.
    </p>
  `
  return emailLayout(content, `Your meeting with ${data.hostName} is confirmed for ${whenText}`)
}

export function bookingConfirmedHostEmail(data: {
  title: string
  customerName: string
  customerEmail: string
  customerNotes?: string
  startTime: Date
  durationMinutes?: number
  timezone?: string
  meetingType?: 'google_meet' | 'phone_call'
  customerPhone?: string
  meetLink?: string | null
}): string {
  const whenText = formatTimeInTimezone(data.startTime, data.timezone ?? 'UTC')

  const locationRow = data.meetingType === 'phone_call'
    ? `<tr><td class="label">Where</td><td class="value">Phone call — call ${data.customerName}${data.customerPhone ? ` at ${data.customerPhone}` : ''}</td></tr>`
    : data.meetLink
      ? `<tr><td class="label">Where</td><td class="value"><a href="${data.meetLink}">${data.meetLink}</a></td></tr>`
      : `<tr><td class="label">Where</td><td class="value">Google Meet link in your calendar invite</td></tr>`

  const content = `
    <h2>New booking: ${data.customerName} 📅</h2>
    <p>Someone just booked time with you. Here are the details:</p>
    <table class="details">
      <tr><td class="label">Meeting</td><td class="value">${data.title}</td></tr>
      <tr><td class="label">When</td><td class="value">${whenText}</td></tr>
      ${data.durationMinutes ? `<tr><td class="label">Duration</td><td class="value">${data.durationMinutes} minutes</td></tr>` : ''}
      <tr><td class="label">Guest</td><td class="value">${data.customerName} (<a href="mailto:${data.customerEmail}">${data.customerEmail}</a>)</td></tr>
      ${locationRow}
      ${data.customerNotes ? `<tr><td class="label">Notes</td><td class="value">${data.customerNotes}</td></tr>` : ''}
    </table>
    ${data.meetingType !== 'phone_call' && data.meetLink ? `<a class="button" href="${data.meetLink}">Join Google Meet</a>` : ''}
  `
  return emailLayout(content, `New booking from ${data.customerName} on ${whenText}`)
}

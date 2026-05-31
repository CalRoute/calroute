import { emailLayout } from './layout'
import { formatTimeInTimezone } from '@/lib/format-time'

export function bookingCancelledGuestEmail(data: {
  title: string
  startTime: Date
  timezone: string
}): string {
  const content = `
    <h2>Your booking has been cancelled</h2>
    <p>Your meeting <strong>${data.title}</strong> on ${formatTimeInTimezone(data.startTime, data.timezone)} has been cancelled.</p>
    <p>You can book a new time at any time.</p>
  `
  return emailLayout(content)
}

export function bookingCancelledHostEmail(data: {
  title: string
  customerName: string
  startTime: Date
  timezone: string
  cancelledBy: 'guest' | 'host'
}): string {
  const content = `
    <h2>A booking has been cancelled</h2>
    <p><strong>${data.customerName}</strong>'s meeting (<strong>${data.title}</strong>) on ${formatTimeInTimezone(data.startTime, data.timezone)} has been cancelled.</p>
    ${data.cancelledBy === 'guest' ? '<p>The guest cancelled this meeting.</p>' : ''}
  `
  return emailLayout(content)
}

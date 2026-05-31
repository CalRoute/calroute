import { emailLayout } from './layout'

export function bookingCancelledGuestEmail(data: {
  title: string
  startTime: Date
}): string {
  const content = `
    <h2>Your booking has been cancelled</h2>
    <p>Your meeting <strong>${data.title}</strong> on ${data.startTime.toLocaleString()} has been cancelled.</p>
    <p>You can book a new time at any time.</p>
  `
  return emailLayout(content)
}

export function bookingCancelledHostEmail(data: {
  title: string
  customerName: string
  startTime: Date
  cancelledBy: 'guest' | 'host'
}): string {
  const content = `
    <h2>A booking has been cancelled</h2>
    <p><strong>${data.customerName}</strong>'s meeting (<strong>${data.title}</strong>) on ${data.startTime.toLocaleString()} has been cancelled.</p>
    ${data.cancelledBy === 'guest' ? '<p>The guest cancelled this meeting.</p>' : ''}
  `
  return emailLayout(content)
}

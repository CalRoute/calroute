import { emailLayout } from './layout'

export function bookingTransferredNewHostEmail(data: {
  title: string
  customerName: string
  customerEmail: string
  startTime: Date
  transferredBy: string
}): string {
  const content = `
    <h2>A booking has been transferred to you</h2>
    <ul>
      <li><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</li>
      <li><strong>Meeting:</strong> ${data.title}</li>
      <li><strong>When:</strong> ${data.startTime.toLocaleString()}</li>
      <li><strong>Transferred by:</strong> ${data.transferredBy}</li>
    </ul>
    <p>Check your calendar for the invite.</p>
  `
  return emailLayout(content)
}

export function bookingTransferredGuestEmail(data: {
  title: string
  newHostName: string
  startTime: Date
}): string {
  const content = `
    <h2>Your meeting host has changed</h2>
    <p>Your meeting <strong>${data.title}</strong> on ${data.startTime.toLocaleString()} will now be with <strong>${data.newHostName}</strong>.</p>
    <p>Your calendar invite has been updated.</p>
  `
  return emailLayout(content)
}

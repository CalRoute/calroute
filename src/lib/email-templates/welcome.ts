import { emailLayout } from './layout'

export function welcomeEmail(data: {
  name: string
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const content = `
    <h2>Hey ${firstName}, welcome to CalRoute! 👋</h2>
    <p>Really glad you're here. Getting started takes about 5 minutes:</p>
    <table class="details">
      <tr>
        <td class="label">First</td>
        <td class="value">Connect your Google Calendar so we know when you're actually free.</td>
      </tr>
      <tr>
        <td class="label">Then</td>
        <td class="value">Create a booking link and pick your hours.</td>
      </tr>
      <tr>
        <td class="label">Finally</td>
        <td class="value">Share the link in your email signature, on your website, wherever works for you.</td>
      </tr>
    </table>
    <a class="button" href="${data.appUrl}/dashboard">Let's go →</a>
    <hr />
    <p class="actions">Got questions? Just reply here. We actually read these.</p>
  `
  return emailLayout(content, `Hey ${firstName}, your CalRoute account is ready!`)
}

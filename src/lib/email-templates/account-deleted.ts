import { emailLayout } from './layout'

export function accountDeletedEmail(data: {
  name: string
  appUrl: string
}): string {
  const firstName = data.name.split(' ')[0]
  const content = `
    <h2>Take care, ${firstName}.</h2>
    <p>Your CalRoute account has been deleted — everything's gone: your booking links, history, and any active subscription. Clean slate.</p>
    <p>If you ever feel like coming back, the door's open. No hard feelings. 🙂</p>
    <a class="button" href="${data.appUrl}">Come back anytime</a>
    <hr />
    <p class="actions">Didn't request this? Reply to this email right away and we'll sort it out.</p>
  `
  return emailLayout(content, `We'll miss you, ${firstName}.`)
}

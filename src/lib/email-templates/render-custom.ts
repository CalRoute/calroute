import { emailLayout } from './layout'

export function renderCustomTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let html = template

  // Replace {{variable}} tokens with values
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    html = html.replace(regex, value || '')
  }

  // Wrap in layout
  return emailLayout(html)
}

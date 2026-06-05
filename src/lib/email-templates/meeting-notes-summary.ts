import { emailLayout } from './layout'

interface ActionItem {
  text: string
  description?: string
  dueDate?: string
  assigneeName: string | null
  done?: boolean
  trelloCardId?: string
}

interface MeetingNotesSummaryData {
  meetingTitle: string
  occurrence: string
  content: string
  actionItems: ActionItem[]
  dashboardUrl: string
}

export function meetingNotesSummaryEmail(data: MeetingNotesSummaryData): string {
  const { meetingTitle, occurrence, content, actionItems, dashboardUrl } = data

  const occurrenceDate = new Date(occurrence).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const actionItemsHtml = actionItems.length > 0
    ? `
      <h3>Action Items</h3>
      <ul style="list-style: none; padding: 0;">
        ${actionItems.map(item => {
          const dueDate = item.dueDate ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null
          return `
          <li style="margin-bottom: 16px; padding: 12px; background-color: #f9f9f9; border-left: 3px solid #0D7377; border-radius: 4px;">
            <strong style="font-size: 1.1em;">${item.text}</strong>
            ${item.description ? `<p style="margin: 6px 0 0 0; color: #666; font-size: 0.95em;">${item.description}</p>` : ''}
            <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
              ${item.assigneeName ? `<span>👤 ${item.assigneeName}</span>` : '<span>👤 Unassigned</span>'}
              ${dueDate ? ` · <span>📅 Due ${dueDate}</span>` : ''}
              ${item.done ? ' · <span style="color: #0D7377;">✓ Done</span>' : ''}
            </div>
            ${item.trelloCardId ? `<p style="margin: 6px 0 0 0;"><a href="https://trello.com/c/${item.trelloCardId}" style="color: #0D7377; text-decoration: none; font-size: 0.9em;">→ View in Trello</a></p>` : ''}
          </li>
        `}).join('')}
      </ul>
    `
    : '<p><em>No action items recorded.</em></p>'

  const content_html = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('<br />')

  const html = `
    <h2>${meetingTitle}</h2>
    <p><strong>${occurrenceDate}</strong></p>

    <h3>Notes</h3>
    <p>${content_html}</p>

    ${actionItemsHtml}

    <p style="margin-top: 24px;">
      <a href="${dashboardUrl}/team/meetings"><strong>View in CalRoute →</strong></a>
    </p>
  `

  return emailLayout(html)
}

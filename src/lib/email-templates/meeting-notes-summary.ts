import { emailLayout } from './layout'

interface ActionItem {
  text: string
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
      <ul>
        ${actionItems.map(item => `
          <li>
            <strong>${item.text}</strong>
            ${item.assigneeName ? ` — assigned to ${item.assigneeName}` : ' — unassigned'}
            ${item.done ? ' <span style="color: #0D7377;">(done)</span>' : ''}
            ${item.trelloCardId ? ` <a href="https://trello.com/c/${item.trelloCardId}" style="color: #0D7377; font-size: 0.9em;">[view in Trello]</a>` : ''}
          </li>
        `).join('')}
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

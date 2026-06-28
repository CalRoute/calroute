import { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/session'
import { listIssues, createIssue, getPriorityLabel, getCategoryLabel } from '@/lib/github-issues'

export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  try {
    const ghState = statusFilter === 'open' ? 'open'
      : statusFilter === 'closed' || statusFilter === 'resolved' ? 'closed'
      : 'all'

    const issues = await listIssues(ghState)

    const tickets = issues.map(issue => ({
      id: String(issue.number),
      number: issue.number,
      subject: issue.title,
      description: issue.body || '',
      status: issue.state === 'open' ? 'open' : 'resolved',
      priority: getPriorityLabel(issue.labels),
      category: getCategoryLabel(issue.labels),
      assignedTo: issue.assignees[0]?.login ?? null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      resolvedAt: issue.closed_at,
      githubUrl: issue.html_url,
      author: issue.user.login,
    }))

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: 0,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      avgResolutionTime: calcAvgResolution(issues),
    }

    return Response.json({ tickets, stats })
  } catch (error) {
    console.error('[support] error:', error)
    return Response.json({ error: 'Failed to fetch issues from GitHub' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session?.totpVerified) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { title, body, priority = 'medium', category = 'other' } = await request.json()
    if (!title) return Response.json({ error: 'Title is required' }, { status: 400 })

    const labels = [`priority:${priority}`, category]
    const issue = await createIssue({ title, body: body || '', labels })
    return Response.json({ id: String(issue.number), number: issue.number, url: issue.html_url })
  } catch (error) {
    console.error('[support] error creating issue:', error)
    return Response.json({ error: 'Failed to create GitHub issue' }, { status: 500 })
  }
}

function calcAvgResolution(issues: any[]): number {
  const resolved = issues.filter(i => i.state === 'closed' && i.closed_at)
  if (resolved.length === 0) return 0
  const hours = resolved.map((i: any) =>
    (new Date(i.closed_at).getTime() - new Date(i.created_at).getTime()) / 3600000
  )
  return Math.round(hours.reduce((a: number, b: number) => a + b, 0) / hours.length)
}

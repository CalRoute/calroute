const REPO = 'CalRoute/calroute'
const BASE = 'https://api.github.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  labels: { name: string; color: string }[]
  assignees: { login: string }[]
  created_at: string
  updated_at: string
  closed_at: string | null
  html_url: string
  user: { login: string }
}

export function getPriorityLabel(labels: { name: string }[]): string {
  const p = labels.find(l => l.name.startsWith('priority:'))
  return p ? p.name.replace('priority:', '') : 'medium'
}

export function getCategoryLabel(labels: { name: string }[]): string {
  const cats = ['bug', 'feature-request', 'billing', 'technical']
  const c = labels.find(l => cats.includes(l.name))
  return c ? c.name : 'other'
}

export async function listIssues(state: 'open' | 'closed' | 'all' = 'all'): Promise<GitHubIssue[]> {
  const res = await fetch(
    `${BASE}/repos/${REPO}/issues?state=${state}&per_page=100&sort=created&direction=desc`,
    { headers: headers(), next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const data: GitHubIssue[] = await res.json()
  // Filter out pull requests (GitHub returns PRs in issues endpoint)
  return data.filter(i => !('pull_request' in i))
}

export async function getIssue(number: number): Promise<GitHubIssue> {
  const res = await fetch(`${BASE}/repos/${REPO}/issues/${number}`, {
    headers: headers(),
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function createIssue(data: {
  title: string
  body: string
  labels?: string[]
}): Promise<GitHubIssue> {
  const res = await fetch(`${BASE}/repos/${REPO}/issues`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function updateIssue(number: number, data: {
  state?: 'open' | 'closed'
  labels?: string[]
  assignees?: string[]
  title?: string
  body?: string
}): Promise<GitHubIssue> {
  const res = await fetch(`${BASE}/repos/${REPO}/issues/${number}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function addIssueComment(number: number, body: string): Promise<void> {
  const res = await fetch(`${BASE}/repos/${REPO}/issues/${number}/comments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ body }),
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
}

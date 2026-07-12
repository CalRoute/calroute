export async function addVercelDomain(domain: string): Promise<{ ok: boolean; alreadyExists: boolean }> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return { ok: true, alreadyExists: false }

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: domain }),
  })

  if (res.status === 409) return { ok: true, alreadyExists: true }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[vercel-domains] add failed:', err)
    return { ok: false, alreadyExists: false }
  }
  return { ok: true, alreadyExists: false }
}

export async function removeVercelDomain(domain: string): Promise<void> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) return

  const res = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok && res.status !== 404) {
    console.error('[vercel-domains] remove failed for', domain, res.status)
  }
}

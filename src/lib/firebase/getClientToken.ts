export async function getClientToken(): Promise<string> {
  const res = await fetch('/api/auth/token')
  if (!res.ok) {
    window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.pathname)
    throw new Error('Not authenticated')
  }
  const { token } = await res.json()
  return token
}

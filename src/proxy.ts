import { NextRequest, NextResponse } from 'next/server'

const CALROUTE_HOSTS = ['calroute.me', 'www.calroute.me', 'localhost', '127.0.0.1']

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const bareHost = hostname.split(':')[0]

  // Only intercept requests that aren't on our own domain
  if (CALROUTE_HOSTS.includes(bareHost) || bareHost.endsWith('.vercel.app')) {
    return NextResponse.next()
  }

  // Look up which host owns this custom domain
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calroute.me'
  let slug: string | null = null

  try {
    const res = await fetch(
      `${appUrl}/api/internal/custom-domain?hostname=${encodeURIComponent(bareHost)}`
    )
    if (res.ok) {
      const data = await res.json()
      slug = data.slug ?? null
    }
  } catch {
    // If lookup fails, fall through to normal routing
  }

  if (!slug) return NextResponse.next()

  // Rewrite: custom domain root → /book/[defaultSlug]
  // Subpaths are preserved: meet.dolbyto.dev/quick-call → /book/quick-call
  const url = request.nextUrl.clone()
  const incomingPath = request.nextUrl.pathname

  if (incomingPath === '/' || incomingPath === '') {
    url.pathname = `/book/${slug}`
  } else {
    // Strip leading slash and treat as a booking slug
    url.pathname = `/book${incomingPath}`
  }

  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

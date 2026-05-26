import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      scopes: 'email profile',
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`)
  }

  return NextResponse.redirect(data.url)
}

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure host record exists
      const serviceSupabase = await createServiceClient()
      await serviceSupabase.from('hosts').upsert({
        user_id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.full_name ?? data.user.email!.split('@')[0],
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: true,
      })
    }
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
}

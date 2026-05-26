import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createOAuthClient } from '@/lib/google/calendar'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = request.cookies.get('google_oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=oauth_failed`
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  }

  try {
    const client = createOAuthClient()
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get account email
    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Get host record
    const serviceSupabase = await createServiceClient()
    const { data: host } = await serviceSupabase
      .from('hosts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!host) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=host_not_found`
      )
    }

    // Save calendar connection
    await serviceSupabase.from('connected_calendars').upsert({
      host_id: host.id,
      provider: 'google',
      account_email: userInfo.email!,
      calendar_id: 'primary',
      label: 'Primary',
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expires_at: new Date(tokens.expiry_date!).toISOString(),
      is_active: true,
    }, {
      onConflict: 'host_id,account_email,calendar_id',
    })

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=calendar_connected`
    )
    response.cookies.delete('google_oauth_state')
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=oauth_failed`
    )
  }
}

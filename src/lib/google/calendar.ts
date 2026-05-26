import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import type { ConnectedCalendar } from '@/types/database'

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  )
}

export function getAuthUrl(state: string): string {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state,
  })
}

export async function refreshAccessToken(
  calendar: Pick<ConnectedCalendar, 'access_token' | 'refresh_token' | 'expires_at'>
): Promise<{ access_token: string; expires_at: Date } | null> {
  try {
    const client = createOAuthClient()
    client.setCredentials({
      access_token: calendar.access_token,
      refresh_token: calendar.refresh_token,
    })
    const { credentials } = await client.refreshAccessToken()
    return {
      access_token: credentials.access_token!,
      expires_at: new Date(credentials.expiry_date!),
    }
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return null
  }
}

export async function getAuthenticatedClient(
  calendar: ConnectedCalendar,
  onTokenRefresh?: (token: string, expiresAt: Date) => Promise<void>
): Promise<OAuth2Client> {
  const client = createOAuthClient()

  // Check if token needs refresh (refresh 5 min early)
  const expiresAt = new Date(calendar.expires_at)
  const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000

  if (needsRefresh) {
    const refreshed = await refreshAccessToken(calendar)
    if (refreshed && onTokenRefresh) {
      await onTokenRefresh(refreshed.access_token, refreshed.expires_at)
      client.setCredentials({ access_token: refreshed.access_token })
    }
  } else {
    client.setCredentials({ access_token: calendar.access_token })
  }

  return client
}

export interface BusySlot {
  start: string
  end: string
}

export interface FreeBusyResult {
  calendarId: string
  busy: BusySlot[]
}

/**
 * Query Google Calendar freeBusy API for multiple calendars at once.
 * Returns a map of calendarId → busy slots.
 */
export async function queryFreeBusy(
  calendars: ConnectedCalendar[],
  timeMin: Date,
  timeMax: Date,
  onTokenRefresh?: (calendarId: string, token: string, expiresAt: Date) => Promise<void>
): Promise<Map<string, BusySlot[]>> {
  if (calendars.length === 0) return new Map()

  // Group calendars by account to minimize OAuth clients
  const calendarsByAccount = new Map<string, ConnectedCalendar[]>()
  for (const cal of calendars) {
    const existing = calendarsByAccount.get(cal.access_token) ?? []
    calendarsByAccount.set(cal.access_token, [...existing, cal])
  }

  const result = new Map<string, BusySlot[]>()

  // We'll use the first calendar's credentials to query all (they share an account)
  // For multiple accounts, we need separate requests
  const uniqueAccounts = Array.from(
    new Map(calendars.map(c => [c.account_email, c])).values()
  )

  for (const accountCal of uniqueAccounts) {
    const auth = await getAuthenticatedClient(
      accountCal,
      onTokenRefresh
        ? (token, exp) => onTokenRefresh(accountCal.id, token, exp)
        : undefined
    )

    const calendarClient = google.calendar({ version: 'v3', auth })

    // Get all calendars belonging to this account
    const accountCalendars = calendars.filter(
      c => c.account_email === accountCal.account_email
    )

    const { data } = await calendarClient.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: accountCalendars.map(c => ({ id: c.calendar_id })),
      },
    })

    for (const cal of accountCalendars) {
      const calData = data.calendars?.[cal.calendar_id]
      result.set(cal.id, (calData?.busy ?? []) as BusySlot[])
    }
  }

  return result
}

/**
 * Create a Google Calendar event for a booking.
 */
export async function createCalendarEvent(
  hostCalendar: ConnectedCalendar,
  booking: {
    title: string
    description?: string
    startTime: Date
    endTime: Date
    customerEmail: string
    customerName: string
    hostEmail: string
  }
): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient(hostCalendar)
    const calendarClient = google.calendar({ version: 'v3', auth })

    const { data } = await calendarClient.events.insert({
      calendarId: hostCalendar.calendar_id,
      sendUpdates: 'all',
      requestBody: {
        summary: booking.title,
        description: booking.description,
        start: { dateTime: booking.startTime.toISOString() },
        end: { dateTime: booking.endTime.toISOString() },
        attendees: [
          { email: booking.hostEmail, displayName: 'Host' },
          { email: booking.customerEmail, displayName: booking.customerName },
        ],
        conferenceData: {
          createRequest: {
            requestId: `calroute-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      conferenceDataVersion: 1,
    })

    return data.id ?? null
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    return null
  }
}

/**
 * Delete a Google Calendar event (for cancellations).
 */
export async function deleteCalendarEvent(
  hostCalendar: ConnectedCalendar,
  eventId: string
): Promise<boolean> {
  try {
    const auth = await getAuthenticatedClient(hostCalendar)
    const calendarClient = google.calendar({ version: 'v3', auth })
    await calendarClient.events.delete({
      calendarId: hostCalendar.calendar_id,
      eventId,
      sendUpdates: 'all',
    })
    return true
  } catch {
    return false
  }
}

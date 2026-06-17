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
  calendar: Pick<ConnectedCalendar, 'accessToken' | 'refreshToken' | 'expiresAt'>
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    const client = createOAuthClient()
    client.setCredentials({
      access_token: calendar.accessToken,
      refresh_token: calendar.refreshToken,
    })
    const { credentials } = await client.refreshAccessToken()
    return {
      accessToken: credentials.access_token!,
      expiresAt: new Date(credentials.expiry_date!),
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
  const expiresAt = new Date(calendar.expiresAt)
  const needsRefresh = expiresAt.getTime() - Date.now() < 5 * 60 * 1000

  if (needsRefresh) {
    const refreshed = await refreshAccessToken(calendar)
    if (refreshed && onTokenRefresh) {
      await onTokenRefresh(refreshed.accessToken, refreshed.expiresAt)
      client.setCredentials({ access_token: refreshed.accessToken })
    }
  } else {
    client.setCredentials({ access_token: calendar.accessToken })
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
 *
 * If the query fails (expired token, disconnected calendar, API error),
 * returns empty Map so availability falls back to CalRoute bookings only.
 */
export async function queryFreeBusy(
  calendars: ConnectedCalendar[],
  timeMin: Date,
  timeMax: Date,
  onTokenRefresh?: (calendarId: string, token: string, expiresAt: Date) => Promise<void>
): Promise<Map<string, BusySlot[]>> {
  if (calendars.length === 0) return new Map()

  const result = new Map<string, BusySlot[]>()

  // We'll use the first calendar's credentials to query all (they share an account)
  // For multiple accounts, we need separate requests
  const uniqueAccounts = Array.from(
    new Map(calendars.map(c => [c.accountEmail, c])).values()
  )

  for (const accountCal of uniqueAccounts) {
    try {
      const auth = await getAuthenticatedClient(
        accountCal,
        onTokenRefresh
          ? (token, exp) => onTokenRefresh(accountCal.id, token, exp)
          : undefined
      )

      const calendarClient = google.calendar({ version: 'v3', auth })

      // Get all calendars belonging to this account
      const accountCalendars = calendars.filter(
        c => c.accountEmail === accountCal.accountEmail
      )

      const { data } = await calendarClient.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: accountCalendars.map(c => ({ id: c.calendarId })),
        },
      })

      for (const cal of accountCalendars) {
        const calData = data.calendars?.[cal.calendarId]
        result.set(cal.id, (calData?.busy ?? []) as BusySlot[])
      }
    } catch (error) {
      // Log the error but don't fail the entire availability request
      // Fall back to CalRoute bookings only
      console.error(
        `[calendar] freeBusy query failed for ${accountCal.accountEmail}:`,
        error instanceof Error ? error.message : error
      )

      // Still add calendars to result with empty busy slots (safe fallback)
      const accountCalendars = calendars.filter(
        c => c.accountEmail === accountCal.accountEmail
      )
      for (const cal of accountCalendars) {
        result.set(cal.id, [])
      }
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
    createMeet?: boolean
    location?: string
  }
): Promise<{ eventId: string; meetLink: string | null } | null> {
  try {
    const auth = await getAuthenticatedClient(hostCalendar)
    const calendarClient = google.calendar({ version: 'v3', auth })

    const createMeet = booking.createMeet !== false
    const { data } = await calendarClient.events.insert({
      calendarId: hostCalendar.calendarId,
      sendUpdates: 'all',
      requestBody: {
        summary: booking.title,
        description: booking.description,
        ...(booking.location && { location: booking.location }),
        start: { dateTime: booking.startTime.toISOString() },
        end: { dateTime: booking.endTime.toISOString() },
        attendees: [
          { email: booking.hostEmail, displayName: 'Host' },
          { email: booking.customerEmail, displayName: booking.customerName },
        ],
        ...(createMeet && {
          conferenceData: {
            createRequest: {
              requestId: `calroute-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      },
      ...(createMeet && { conferenceDataVersion: 1 }),
    })

    if (!data.id) return null
    return { eventId: data.id, meetLink: data.hangoutLink ?? null }
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
      calendarId: hostCalendar.calendarId,
      eventId,
      sendUpdates: 'all',
    })
    return true
  } catch {
    return false
  }
}

/**
 * Create a recurring team meeting on Google Calendar.
 */
export async function createRecurringTeamMeeting(
  hostCalendar: ConnectedCalendar,
  meeting: {
    title: string
    description?: string
    startTime: Date
    durationMinutes: number
    attendeeEmails: string[]
    rrule: string
    timezone: string
  }
): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient(hostCalendar)
    const calendarClient = google.calendar({ version: 'v3', auth })

    const endTime = new Date(meeting.startTime.getTime() + meeting.durationMinutes * 60000)

    const { data } = await calendarClient.events.insert({
      calendarId: hostCalendar.calendarId,
      sendUpdates: 'all',
      requestBody: {
        summary: meeting.title,
        description: meeting.description,
        start: {
          dateTime: meeting.startTime.toISOString(),
          timeZone: meeting.timezone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: meeting.timezone,
        },
        recurrence: [meeting.rrule],
        attendees: meeting.attendeeEmails.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `calroute-team-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
      conferenceDataVersion: 1,
    })

    return data.id ?? null
  } catch (error) {
    console.error('Failed to create recurring team meeting:', error)
    return null
  }
}

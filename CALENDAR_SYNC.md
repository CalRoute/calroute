# Calendar Sync Architecture

## Overview

CalRoute syncs bookings with Google Calendar **on-demand** rather than with a scheduled background job. When a booking is created, cancelled, or rescheduled, the corresponding calendar event is immediately updated.

## How It Works

### 1. Calendar Connection

**When:** User clicks "Connect Google Calendar" in settings

**Process:**
- User redirected to Google OAuth consent screen (`/api/auth/google`)
- User grants permissions for calendar access
- Google returns auth code → backend exchanges for tokens (`/api/auth/google/callback`)
- Tokens stored in Firestore at: `hosts/{uid}/connected_calendars/{calendarId}`

**Stored Data:**
```
{
  provider: 'google',
  accountEmail: 'user@gmail.com',
  calendarId: 'primary',
  label: 'Primary',
  accessToken: '...',
  refreshToken: '...',
  expiresAt: 'ISO-8601 timestamp',
  isActive: true,
  createdAt: 'ISO-8601 timestamp',
  lastSyncedAt: 'ISO-8601 timestamp'  // ← Set when connected
}
```

### 2. Booking Creation → Calendar Event

**When:** Customer completes booking at `/api/bookings` POST

**Process:**
1. Load host's **first active** connected calendar
2. Call `createCalendarEvent()` from `/lib/google/calendar.ts`
3. Create Google Calendar event with:
   - Title: `{booking_link_title} — {customer_name}`
   - Description: Customer notes (if provided)
   - Start/End times: From booking
   - Attendees: Customer email + Google Meet link (if not phone call)
4. Store returned `googleEventId` in booking document
5. **Update `lastSyncedAt`** in connected_calendars

**Result:** Booking appears on customer's calendar immediately

### 3. Booking Cancellation → Remove from Calendar

**When:** Customer/host cancels booking at `/api/bookings/[id]/cancel` POST

**Process:**
1. Load booking with `googleEventId`
2. Delete calendar event using `googleEventId`
3. Update booking `status` to `cancelled`

**Result:** Event removed from calendar within seconds

### 4. Booking Reschedule → Update Calendar Event

**When:** Customer/host reschedules at `/api/bookings/[id]/reschedule` POST

**Process:**
1. Delete old calendar event
2. Create new calendar event at new time
3. Store new `googleEventId`
4. Update booking `startTime` and `endTime`

**Result:** Calendar event moves to new time

## Sync Frequency

### On-Demand (Not Scheduled)

Calendar changes happen **instantly** when:
- ✅ Booking created
- ✅ Booking cancelled
- ✅ Booking rescheduled
- ✅ Booking transferred to another team member

**No periodic background sync** - changes are applied immediately.

### Monitoring Sync Health

**Location:** Admin Dashboard → Monitoring → Calendar Sync Status

**Shows:**
- Host email
- Total calendars connected
- Synced calendars count
- Time since last sync
- Sync status: `synced` | `stale` | `outdated`

**Status Definitions:**
- `synced`: Last sync < 60 minutes ago
- `stale`: Last sync < 24 hours ago
- `outdated`: Last sync > 24 hours ago
- `not_connected`: No calendars connected

## Token Management

### Access Token Expiration

Google access tokens expire in **1 hour**. Before token expires:
- Use `refreshToken` to get new `accessToken`
- Update both tokens and `expiresAt` in Firestore

**Implementation:** Handled in `createCalendarEvent()` function

### Scope

Calendars require `calendar` permission scope:
- Read/Write access to calendar events
- Cannot delete calendars
- Cannot change calendar settings

## Errors & Recovery

### If Calendar Event Creation Fails

- Booking is **still created** (not cancelled)
- Customer receives confirmation email
- `googleEventId` remains null
- Admin sees warning in system health

### If Calendar Disconnects (Token Expired)

- Calendar marked as `stale` or `outdated`
- Next booking attempt tries refresh token
- If refresh fails, calendar auto-disabled
- Host notified to reconnect calendar

### If Google API Down

- Booking proceeds without calendar event
- Retry logic: attempts 3 times with exponential backoff
- After 3 failures, booking continues without calendar sync

## Multi-Calendar Support

### Limits

- **Max 5 calendars** per host
- Only **first active calendar** used for booking events
- Prevents API quota exhaustion

### Use Cases

- Primary calendar
- Work calendar
- Team calendar
- Backup calendar
- Integration testing calendar

## Data Flow

```
User Books Appointment
        ↓
POST /api/bookings
        ↓
Check calendar exists & isActive
        ↓
Load tokens from hosts/{uid}/connected_calendars/{id}
        ↓
Call createCalendarEvent()
        ↓
createCalendarEvent() calls Google Calendar API
        ↓
Google returns googleEventId
        ↓
Update booking.googleEventId
        ↓
Update connected_calendars.lastSyncedAt ← NEW
        ↓
Send confirmation emails
        ↓
Fire webhooks
```

## Admin Visibility

### Endpoints

- **GET** `/api/admin/engagement` - Returns calendar sync status
- **Calendar Sync Status** component shows:
  - Hosts with out-of-sync calendars
  - Time since last sync
  - How many calendars synced vs total

### Metrics

From `lib/engagement-metrics.ts`:
```typescript
{
  hostId: string
  email: string
  totalCalendars: number
  syncedCalendars: number
  lastSyncMinutesAgo: number    // Calculated from lastSyncedAt
  syncStatus: 'synced' | 'stale' | 'outdated' | 'not_connected'
}
```

## Performance Considerations

### API Calls per Booking

- 1 call: Check existing bookings
- 1 call: Get calendar tokens
- 1 call: Google Calendar event creation
- 1 call: Update lastSyncedAt

**Total: ~4 Firestore ops + 1 Google API call**

### Quota Management

Google Calendar API has quotas:
- 1M API calls/day per calendar
- 100 concurrent requests per second
- Not an issue for most users

### Caching

- No caching of calendar tokens (security risk)
- Tokens refreshed on-demand
- OAuth state stored in cookies (5 min timeout)

## Future Improvements

1. **Batch Sync**: On background job every night to catch edge cases
2. **Conflict Detection**: Warn if calendar event already exists
3. **Two-Way Sync**: Allow customers to cancel via calendar invitation response
4. **Calendar Selection**: Let host choose which calendar for bookings
5. **Recurring Events**: Support for repeat bookings
6. **Time Zone Sync**: Automatically convert to customer's timezone

## Troubleshooting

### "Calendar not syncing"

Check:
1. Is calendar connected? (Check connected_calendars collection)
2. Is calendar active? (isActive: true)
3. Is token expired? (Check expiresAt timestamp)
4. Did booking creation succeed? (Check googleEventId exists)

### "29M+ minutes ago" Bug (FIXED)

**Was:** Checked wrong collection (`calendars` instead of `connected_calendars`)

**Now:** Correctly checks `connected_calendars` and shows accurate time

### "Email connected but no events showing"

Possible causes:
- Calendar is `sync-disabled` (turned off by user)
- Token refresh failed
- Google Calendar API error (check logs)
- Calendar permission revoked

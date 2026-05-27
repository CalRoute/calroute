# CalRoute

Multi-calendar scheduling engine — connect multiple Google Calendars and share a single booking link, similar to Calendly.

## Features

- **Multi-host scheduling** — one link, multiple available hosts
- **Smart routing** — priority-based or round-robin host assignment
- **Multiple calendars per host** — up to 5 Google Calendars merged for real availability (limit keeps API response times fast)
- **Real-time availability** — Google Calendar freeBusy API, batched per account
- **Race condition protection** — 5-minute slot reservations prevent double-bookings
- **Timezone-aware** — customer timezone auto-detection
- **Confirmation emails** — via Resend
- **Embeddable widget** — drop an iframe on any page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend / Backend | Next.js (App Router, TypeScript) |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google sign-in) |
| Calendar | Google Calendar API (freeBusy + Events) |
| Emails | Resend |
| Deploy | Vercel |

## Dashboard pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview of all booking links |
| `/dashboard/links/new` | Create a booking link |
| `/dashboard/links/[id]` | Edit or delete a booking link |
| `/dashboard/settings` | Profile + connect/disconnect Google Calendars |

## Booking pages

| Route | Description |
|-------|-------------|
| `/book/[slug]` | Public booking page |
| `/embed/[slug]` | Embeddable iframe version |

## Setup

### 1. Clone & install

```bash
git clone https://github.com/CalRoute/calroute.git
cd calroute
npm install
```

### 2. Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** (start in production mode)
5. Go to Project Settings → **General** → Your apps → Add a Web app
   - Copy the `firebaseConfig` values → fill in the `NEXT_PUBLIC_FIREBASE_*` env vars
6. Go to Project Settings → **Service accounts** → Generate new private key
   - Download the JSON → fill in `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
7. In Firebase Console → **Authentication** → Settings → **Authorized domains**, add your Vercel URL

### 3. Google Calendar API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Use the **same Google Cloud project** Firebase created (or link them)
3. Enable **Google Calendar API**
4. Go to **APIs & Services** → Credentials → **Create OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-app.vercel.app/api/auth/google/callback`
6. Copy the Client ID and Client Secret into your env vars

### 4. Resend (emails)

1. Create an account at [resend.com](https://resend.com)
2. Verify a sending domain
3. Create an API key

### 5. Environment variables

Copy `env.example` to `.env.local` and fill in all values:

```env
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=          # paste full key including -----BEGIN/END PRIVATE KEY-----

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=             # must match a verified Resend domain

# App
NEXT_PUBLIC_APP_URL=           # http://localhost:3000 locally, your Vercel URL in prod
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import from Git
3. Expand **Environment Variables** → paste from your `.env.local`
4. Click **Deploy**
5. After deploy, add the Vercel URL to:
   - Firebase Auth → Authorized domains
   - Google Cloud → OAuth redirect URIs

## Firestore data structure

```
hosts/
  {uid}/
    name, email, timezone, avatarUrl, createdAt
    connected_calendars/          # max 5 per host
      {docId}/
        provider, accountEmail, calendarId, label,
        accessToken, refreshToken, expiresAt, isActive
    availability/
      {dayOfWeek}/                # 0 = Sun … 6 = Sat
        dayOfWeek, startTime, endTime

booking_links/
  {linkId}/
    ownerId, slug, title, description, durationMinutes,
    bufferBeforeMinutes, bufferAfterMinutes,
    routingStrategy, isActive, maxDaysAhead, createdAt
    hosts/
      {hostId}/
        priority, lastBookedAt

bookings/
  {bookingId}/
    bookingLinkId, hostId, customerName, customerEmail,
    customerNotes, startTime, endTime, googleEventId,
    status, cancelledAt, cancellationReason, createdAt

slot_reservations/
  {resId}/
    bookingLinkId, hostId, startTime, endTime,
    sessionToken, expiresAt
```

## Calendar connection limits

Each host can connect up to **5 Google Calendars** (across multiple Google accounts). This limit is enforced server-side in the OAuth callback. The cap exists for performance reasons — each unique Google account requires a separate API call when computing availability, so more accounts mean slower booking page loads. Calendars from the same Google account are batched into a single freeBusy query for free.

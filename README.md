# CalRoute

Multi-calendar scheduling engine — connect multiple Google Calendars and share a single booking link, similar to Calendly.

## Features

- Multi-host scheduling — one link, multiple available hosts
- Smart routing — priority-based or round-robin host assignment
- Multiple calendars per host — merge work + personal calendars for availability
- Real-time availability — Google Calendar freeBusy API queries
- Race condition protection — 5-minute slot reservations prevent double-bookings
- Timezone-aware — customer timezone auto-detection
- Confirmation emails — via Resend
- Embeddable widget — drop an iframe on any page

## Tech Stack

- **Frontend/Backend**: Next.js (App Router, TypeScript)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (Google sign-in)
- **Calendar**: Google Calendar API (freeBusy + Events)
- **Emails**: Resend
- **Deploy**: Vercel

## Setup

### 1. Clone & install

```bash
git clone https://github.com/yourusername/calroute.git
cd calroute
npm install
```

### 2. Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in method → **Google**
4. Enable **Firestore Database** (start in production mode)
5. Go to Project Settings → **General** → Your apps → Add a Web app
   - Copy the `firebaseConfig` object → fill in the `NEXT_PUBLIC_FIREBASE_*` vars
6. Go to Project Settings → **Service accounts** → Generate new private key
   - Download the JSON → fill in `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
7. Deploy Firestore rules: `firebase deploy --only firestore:rules`
8. Deploy indexes: `firebase deploy --only firestore:indexes`

### 3. Google Calendar API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Use the **same Google Cloud project** Firebase created (or link them)
3. Enable **Google Calendar API**
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URIs:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://your-app.vercel.app/api/auth/google/callback`
6. Copy Client ID and Secret

### 4. Resend (emails)

Create account at [resend.com](https://resend.com), create an API key.

### 5. Environment variables

Copy `.env.example` to `.env.local` and fill in all values.

### 6. Run locally

```bash
npm run dev
```

## Firestore Data Structure

```
hosts/
  {uid}/
    name, email, timezone, avatarUrl, createdAt
    connected_calendars/
      {docId}/
        provider, accountEmail, calendarId, accessToken, refreshToken, ...
    availability/
      {dayOfWeek}/
        dayOfWeek, startTime, endTime

booking_links/
  {linkId}/
    slug, title, durationMinutes, routingStrategy, ownerId, ...
    hosts/
      {hostId}/
        priority, lastBookedAt

bookings/
  {bookingId}/
    bookingLinkId, hostId, customerName, startTime, status, ...

slot_reservations/
  {resId}/
    hostId, startTime, sessionToken, expiresAt, ...
```

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import from Git
3. Add all env variables from `.env.local` in Vercel dashboard
4. Deploy

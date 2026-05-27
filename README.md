# CalRoute

Multi-calendar scheduling engine — connect multiple Google Calendars and share a single booking link, similar to Calendly.

## Features

- 🗓 **Multi-host scheduling** — one link, multiple available hosts
- 🔄 **Smart routing** — priority-based or round-robin host assignment
- 📅 **Multiple calendars per host** — merge work + personal calendars for availability
- ⚡ **Real-time availability** — Google Calendar freeBusy API queries
- 🔒 **Race condition protection** — 5-minute slot reservations prevent double-bookings
- 🌍 **Timezone-aware** — customer timezone auto-detection
- 📧 **Confirmation emails** — via Resend
- 🔗 **Embeddable widget** — drop an iframe on any page

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router, TypeScript)
- **Database/Auth**: Supabase (PostgreSQL + Row Level Security)
- **Calendar**: Google Calendar API (freeBusy + Events)
- **Emails**: Resend
- **Deploy**: Netlify (free tier)

## Setup

### 1. Clone & install

```bash
git clone https://github.com/yourusername/calroute.git
cd calroute
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

**Supabase**: Create a project at [supabase.com](https://supabase.com)
- Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API
- Get `SUPABASE_SERVICE_ROLE_KEY` from the same page (keep secret!)

**Google OAuth**:
- Go to [console.cloud.google.com](https://console.cloud.google.com)
- Create a project → Enable Google Calendar API + Google OAuth
- Create OAuth 2.0 credentials (Web application)
- Add these authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback` (local dev)
  - `http://localhost:3000/api/auth/google/callback` (local dev)
  - `https://your-site.netlify.app/api/auth/callback` (production)
  - `https://your-site.netlify.app/api/auth/google/callback` (production)
- Copy Client ID and Secret

**Resend**: Create account at [resend.com](https://resend.com), create an API key

### 3. Database setup

Paste the contents of `supabase/schema.sql` into your Supabase SQL editor and run it.

Also configure Supabase Auth:
- Go to Auth → Providers → Enable Google
- Add your Google Client ID and Secret
- Add `https://your-site.netlify.app/api/auth/callback` to the allowed redirect URLs

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Supabase OAuth + Google Calendar OAuth
│   │   ├── availability/  # Slot computation endpoint
│   │   ├── bookings/      # Booking creation + emails
│   │   └── slots/reserve/ # Slot reservation (race condition protection)
│   ├── book/[slug]/       # Customer-facing booking page
│   ├── embed/[slug]/      # iFrame embed version
│   ├── dashboard/         # Host dashboard
│   └── login/             # Auth page
├── components/
│   └── booking/
│       └── BookingWidget.tsx  # Main booking UI (3-step flow)
├── lib/
│   ├── google/calendar.ts     # Google Calendar API + OAuth helpers
│   ├── scheduling/engine.ts   # Core availability computation
│   └── supabase/              # Client, server, middleware
└── types/
    └── database.ts            # TypeScript types for all DB tables
```

## Embedding

Add this iframe anywhere:

```html
<iframe
  src="https://your-site.netlify.app/embed/your-link-slug"
  width="100%"
  height="600px"
  frameborder="0"
  style="border-radius: 16px;"
></iframe>
```

## Deploy to Netlify (free)

### Option A — GitHub (recommended, auto-deploys)

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Select your repo
4. Build settings are auto-detected from `netlify.toml`
5. Go to **Site settings → Environment variables** and add all vars from `.env.local`
6. Click **Deploy site**

Every push to `main` triggers an automatic redeploy.

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:import .env.local
netlify deploy --prod
```

### After deploying

Update these with your real Netlify URL:
- `NEXT_PUBLIC_APP_URL` in Netlify env vars → `https://your-site.netlify.app`
- Google Cloud Console → OAuth redirect URIs → add your Netlify URLs
- Supabase → Auth → URL Configuration → add your Netlify URL

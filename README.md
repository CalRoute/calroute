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

- **Frontend/Backend**: Next.js 14 (App Router, TypeScript)
- **Database/Auth**: Supabase (PostgreSQL + Row Level Security)
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
- Create a project, enable Google Calendar API + Google OAuth
- Create OAuth 2.0 credentials (Web application)
- Add `http://localhost:3000/api/auth/callback` to authorized redirect URIs
- Also add `http://localhost:3000/api/auth/google/callback` for calendar connections
- Copy Client ID and Secret

**Resend**: Create account at [resend.com](https://resend.com), create an API key

### 3. Database setup

Paste the contents of `supabase/schema.sql` into your Supabase SQL editor and run it.

Also configure Supabase Auth:
- Go to Auth → Providers → Enable Google
- Add your Google Client ID and Secret

### 4. Run locally

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

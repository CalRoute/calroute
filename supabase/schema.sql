-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================
-- HOSTS: Platform users who accept meetings
-- ============================================================
create table hosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text unique not null,
  name text not null,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamp with time zone default now() not null
);

-- RLS
alter table hosts enable row level security;
create policy "hosts: own row" on hosts for all using (auth.uid() = user_id);

-- ============================================================
-- CONNECTED CALENDARS: OAuth tokens per Google account per host
-- ============================================================
create table connected_calendars (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references hosts(id) on delete cascade not null,
  provider text not null default 'google',
  account_email text not null,
  calendar_id text not null default 'primary', -- specific calendar within the account
  label text,                                   -- e.g. "Work", "Personal"
  access_token text not null,
  refresh_token text not null,
  expires_at timestamp with time zone not null,
  is_active boolean default true,
  created_at timestamp with time zone default now() not null,
  unique(host_id, account_email, calendar_id)
);

alter table connected_calendars enable row level security;
create policy "calendars: own rows" on connected_calendars for all
  using (host_id in (select id from hosts where user_id = auth.uid()));

-- ============================================================
-- HOST AVAILABILITY WINDOWS: Weekly recurring schedule
-- ============================================================
create table host_availability (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references hosts(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  start_time time not null,  -- e.g. 09:00
  end_time time not null,    -- e.g. 17:00
  unique(host_id, day_of_week)
);

alter table host_availability enable row level security;
create policy "availability: own rows" on host_availability for all
  using (host_id in (select id from hosts where user_id = auth.uid()));

-- ============================================================
-- BOOKING LINKS: The unified link shared with customers
-- ============================================================
create table booking_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references hosts(id) on delete cascade not null, -- who created the link
  slug text unique not null,
  title text not null,
  description text,
  duration_minutes integer not null default 30,
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  routing_strategy text not null default 'priority' check (routing_strategy in ('priority', 'round_robin')),
  is_active boolean default true,
  max_days_ahead integer default 30, -- how far into future customers can book
  created_at timestamp with time zone default now() not null
);

alter table booking_links enable row level security;
create policy "links: owner access" on booking_links for all
  using (owner_id in (select id from hosts where user_id = auth.uid()));
create policy "links: public read active" on booking_links for select
  using (is_active = true);

-- ============================================================
-- BOOKING LINK HOSTS: Which hosts are on a given link
-- ============================================================
create table booking_link_hosts (
  booking_link_id uuid references booking_links(id) on delete cascade,
  host_id uuid references hosts(id) on delete cascade,
  priority integer default 1,              -- higher = higher priority
  last_booked_at timestamp with time zone, -- for round-robin tie-breaking
  primary key (booking_link_id, host_id)
);

alter table booking_link_hosts enable row level security;
create policy "link_hosts: owner can manage" on booking_link_hosts for all
  using (
    booking_link_id in (
      select id from booking_links
      where owner_id in (select id from hosts where user_id = auth.uid())
    )
  );
create policy "link_hosts: public read" on booking_link_hosts for select using (true);

-- ============================================================
-- BOOKINGS: Confirmed reservations
-- ============================================================
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_link_id uuid references booking_links(id) not null,
  host_id uuid references hosts(id) not null,
  customer_name text not null,
  customer_email text not null,
  customer_notes text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  google_event_id text,        -- Google Calendar event ID for sync/cancellation
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'rescheduled')),
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  created_at timestamp with time zone default now() not null,
  -- Prevent double-bookings at the DB level
  unique(host_id, start_time)
);

alter table bookings enable row level security;
create policy "bookings: host can read own" on bookings for select
  using (host_id in (select id from hosts where user_id = auth.uid()));
create policy "bookings: public insert" on bookings for insert with check (true);
create policy "bookings: host can update own" on bookings for update
  using (host_id in (select id from hosts where user_id = auth.uid()));

-- ============================================================
-- SLOT RESERVATIONS: Short-lived locks while customer fills form
-- ============================================================
create table slot_reservations (
  id uuid primary key default gen_random_uuid(),
  booking_link_id uuid references booking_links(id) not null,
  host_id uuid references hosts(id) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  session_token text not null,    -- random token given to the customer's browser
  expires_at timestamp with time zone not null default (now() + interval '5 minutes'),
  unique(host_id, start_time)
);

-- Auto-cleanup expired reservations
create or replace function cleanup_expired_reservations()
returns void as $$
  delete from slot_reservations where expires_at < now();
$$ language sql;

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_bookings_host_start on bookings(host_id, start_time);
create index idx_bookings_link on bookings(booking_link_id);
create index idx_slot_reservations_host_start on slot_reservations(host_id, start_time);
create index idx_connected_calendars_host on connected_calendars(host_id);
create index idx_host_availability_host on host_availability(host_id);
create index idx_booking_link_hosts_link on booking_link_hosts(booking_link_id);

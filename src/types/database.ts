// Firebase / Firestore document types for CalRoute

export interface Host {
  uid: string
  email: string
  name: string
  avatarUrl: string | null
  timezone: string
  stripeCustomerId?: string | null
  createdAt: string
}

export interface ConnectedCalendar {
  id: string           // Firestore doc ID
  provider: string
  accountEmail: string
  calendarId: string
  label: string | null
  accessToken: string
  refreshToken: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export interface HostAvailability {
  dayOfWeek: number    // 0=Sun, 6=Sat
  startTime: string    // "09:00"
  endTime: string      // "17:00"
}

export interface BookingLink {
  id: string
  ownerId: string
  slug: string
  title: string
  description: string | null
  durationMinutes: number
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  routingStrategy: 'priority' | 'round_robin'
  meetingType?: 'google_meet' | 'phone_call'
  isActive: boolean
  maxDaysAhead: number
  createdAt: string
}

// Shape expected by BookingWidget (snake_case for backwards compat)
export interface BookingLinkWidget {
  id: string
  owner_id: string
  slug: string
  title: string
  description: string | null
  duration_minutes: number
  buffer_before_minutes: number
  buffer_after_minutes: number
  routing_strategy: 'priority' | 'round_robin'
  is_active: boolean
  max_days_ahead: number
  created_at: string
}

export interface BookingLinkHost {
  hostId: string
  priority: number
  lastBookedAt: string | null
}

export interface Booking {
  id: string
  bookingLinkId: string
  hostId: string
  customerName: string
  customerEmail: string
  customerNotes: string | null
  customerPhone?: string | null
  startTime: string
  endTime: string
  googleEventId: string | null
  status: 'confirmed' | 'cancelled' | 'rescheduled'
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
}

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      hosts: {
        Row: {
          id: string
          user_id: string
          email: string
          name: string
          avatar_url: string | null
          timezone: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['hosts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['hosts']['Insert']>
      }
      connected_calendars: {
        Row: ConnectedCalendar
        Insert: Omit<ConnectedCalendar, 'id' | 'created_at'>
        Update: Partial<Omit<ConnectedCalendar, 'id'>>
      }
      host_availability: {
        Row: {
          id: string
          host_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Insert: Omit<Database['public']['Tables']['host_availability']['Row'], 'id'>
        Update: Partial<Omit<Database['public']['Tables']['host_availability']['Row'], 'id'>>
      }
      booking_links: {
        Row: BookingLink
        Insert: Omit<BookingLink, 'id' | 'created_at'>
        Update: Partial<Omit<BookingLink, 'id'>>
      }
      booking_link_hosts: {
        Row: {
          booking_link_id: string
          host_id: string
          priority: number
          last_booked_at: string | null
        }
        Insert: Database['public']['Tables']['booking_link_hosts']['Row']
        Update: Partial<Database['public']['Tables']['booking_link_hosts']['Row']>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at'>
        Update: Partial<Omit<Booking, 'id'>>
      }
      slot_reservations: {
        Row: {
          id: string
          booking_link_id: string
          host_id: string
          start_time: string
          end_time: string
          session_token: string
          expires_at: string
        }
        Insert: Omit<Database['public']['Tables']['slot_reservations']['Row'], 'id' | 'expires_at'>
        Update: Partial<Database['public']['Tables']['slot_reservations']['Row']>
      }
    }
  }
}

export interface ConnectedCalendar {
  id: string
  host_id: string
  provider: string
  account_email: string
  calendar_id: string
  label: string | null
  access_token: string
  refresh_token: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface BookingLink {
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

export interface Booking {
  id: string
  booking_link_id: string
  host_id: string
  customer_name: string
  customer_email: string
  customer_notes: string | null
  start_time: string
  end_time: string
  google_event_id: string | null
  status: 'confirmed' | 'cancelled' | 'rescheduled'
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { addMinutes, parseISO } from 'date-fns'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { booking_link_id, host_id, start_time, duration_minutes } = body

  if (!booking_link_id || !host_id || !start_time || !duration_minutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const session_token = crypto.randomBytes(32).toString('hex')
  const startTime = parseISO(start_time)
  const endTime = addMinutes(startTime, duration_minutes)

  // Clean up expired reservations first
  await supabase.rpc('cleanup_expired_reservations')

  // Try to insert a reservation (unique constraint prevents double-reserving)
  const { error } = await supabase.from('slot_reservations').insert({
    booking_link_id,
    host_id,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    session_token,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This slot is currently being reserved by another user.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to reserve slot' }, { status: 500 })
  }

  return NextResponse.json({ session_token, expires_in_seconds: 300 })
}

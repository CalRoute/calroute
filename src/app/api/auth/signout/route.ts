import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  response.cookies.delete('firebase-session')
  response.cookies.delete('firebase-token') // legacy
  return response
}

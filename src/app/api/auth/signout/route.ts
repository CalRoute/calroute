import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`)
  response.cookies.delete('calroute-session')
  response.cookies.delete('calroute-refresh')
  response.cookies.delete('firebase-token')   // legacy
  response.cookies.delete('firebase-session') // legacy
  return response
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/firebase/session'
import { getTotpSecret, createTotpSecret, getTotpUri } from '@/lib/admin-totp'
import QRCode from 'qrcode'

const ADMIN_UIDS = process.env.ADMIN_UIDS?.split(',') ?? []

export async function GET() {
  const user = await requireUser('/dashboard/admin')
  if (!ADMIN_UIDS.includes(user.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let secret = await getTotpSecret()
  const isNew = !secret
  if (!secret) {
    secret = await createTotpSecret()
  }

  const uri = getTotpUri(secret, user.email)
  const qrDataUrl = await QRCode.toDataURL(uri)

  return NextResponse.json({ qrDataUrl, isNew, secret })
}

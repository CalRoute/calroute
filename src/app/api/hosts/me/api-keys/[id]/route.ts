export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const keyDoc = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('api_keys')
      .doc(id)
      .get()

    if (!keyDoc.exists) {
      return NextResponse.json({ error: 'Key not found' }, { status: 404 })
    }

    await keyDoc.ref.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[api-keys-delete] error:', error)
    return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 })
  }
}

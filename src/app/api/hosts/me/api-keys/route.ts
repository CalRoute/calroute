export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { adminDb } from '@/lib/firebase/admin'
import crypto from 'crypto'

function generateRandomKey(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const keysSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('api_keys')
      .get()

    const keys = keysSnap.docs.map(d => {
      const data = d.data()
      return {
        id: d.id,
        name: data.name,
        createdAt: data.createdAt,
      }
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('[api-keys] error:', error)
    return NextResponse.json({ error: 'Failed to fetch keys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json() as { name: string }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check limit
    const keysSnap = await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('api_keys')
      .get()

    if (keysSnap.size >= 5) {
      return NextResponse.json({ error: 'Maximum 5 API keys allowed' }, { status: 400 })
    }

    // Generate key
    const plaintext = generateRandomKey(32)
    const hash = hashKey(plaintext)
    const docId = `key_${Date.now()}`

    // Store hash
    await adminDb
      .collection('hosts')
      .doc(user.uid)
      .collection('api_keys')
      .doc(docId)
      .set({
        name,
        keyHash: hash,
        createdAt: new Date().toISOString(),
      })

    return NextResponse.json({
      id: docId,
      plaintext,
      name,
    })
  } catch (error) {
    console.error('[api-keys] error:', error)
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }
}

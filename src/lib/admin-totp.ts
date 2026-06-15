import crypto from 'crypto'
import { adminDb } from '@/lib/firebase/admin'

const COLLECTION = 'admin'
const DOC = 'totp'

export interface TotpDoc {
  secret: string
  setupAt: string
}

// Base32 alphabet (RFC 4648)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20)
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(secret: string): Buffer {
  const s = secret.toUpperCase().replace(/=+$/, '')
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const char of s) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

export function verifyTotpCode(secret: string, token: string): boolean {
  const counter = Math.floor(Date.now() / 1000 / 30)
  // Accept window of ±1 step to account for clock skew
  for (const step of [-1, 0, 1]) {
    if (hotp(secret, counter + step) === token.trim()) return true
  }
  return false
}

export function getTotpUri(secret: string, email: string): string {
  const issuer = 'CalRoute Admin'
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

export async function getTotpSecret(): Promise<string | null> {
  const snap = await adminDb.collection(COLLECTION).doc(DOC).get()
  if (!snap.exists) return null
  return (snap.data() as TotpDoc).secret
}

export async function createTotpSecret(): Promise<string> {
  const secret = generateTotpSecret()
  await adminDb.collection(COLLECTION).doc(DOC).set({
    secret,
    setupAt: new Date().toISOString(),
  })
  return secret
}

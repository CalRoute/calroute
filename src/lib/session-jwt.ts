import { SignJWT, jwtVerify } from 'jose'

export interface SessionPayload {
  uid: string
  email: string
}

function secret() {
  const key = process.env.SESSION_SECRET
  if (!key) throw new Error('SESSION_SECRET is not configured')
  return new TextEncoder().encode(key)
}

export function hasSecret() {
  return !!process.env.SESSION_SECRET
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ uid: payload.uid, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(secret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.uid || !payload.email) return null
    return { uid: payload.uid as string, email: payload.email as string }
  } catch {
    return null
  }
}

// Decode a Firebase ID token payload without network verification
// Safe to use only after Firebase has already verified the token once
export function decodeFirebaseTokenPayload(idToken: string): { uid?: string; email?: string } {
  try {
    const raw = idToken.split('.')[1]
    const payload = JSON.parse(Buffer.from(raw, 'base64url').toString())
    return { uid: payload.user_id ?? payload.sub, email: payload.email }
  } catch {
    return {}
  }
}

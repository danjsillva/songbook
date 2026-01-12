// Firebase JWT validation without heavy SDK
// Uses Google's public keys to verify tokens

interface JWTHeader {
  alg: string
  kid: string
  typ: string
}

interface JWTPayload {
  aud: string
  auth_time: number
  exp: number
  iat: number
  iss: string
  sub: string
  email?: string
  name?: string
}

interface GoogleKey {
  kid: string
  n: string
  e: string
  alg: string
  kty: string
  use: string
}

// Cache for Google's public keys
let cachedKeys: GoogleKey[] | null = null
let keysCacheExpiry = 0

async function getGooglePublicKeys(): Promise<GoogleKey[]> {
  if (cachedKeys && Date.now() < keysCacheExpiry) {
    return cachedKeys
  }

  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com'
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Google public keys')
  }

  const data = await response.json<{ keys: GoogleKey[] }>()
  cachedKeys = data.keys

  // Cache for 1 hour
  keysCacheExpiry = Date.now() + 60 * 60 * 1000

  return cachedKeys
}

function base64UrlDecode(str: string): Uint8Array {
  // Add padding if needed
  const padding = '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function base64UrlToArrayBuffer(str: string): ArrayBuffer {
  const bytes = base64UrlDecode(str)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

async function importPublicKey(key: GoogleKey): Promise<CryptoKey> {
  const jwk = {
    kty: key.kty,
    n: key.n,
    e: key.e,
    alg: key.alg,
    use: key.use,
  }

  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

export async function verifyFirebaseToken(
  token: string,
  projectId: string
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [headerB64, payloadB64, signatureB64] = parts

    // Decode header and payload
    const headerJson = new TextDecoder().decode(base64UrlDecode(headerB64))
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64))

    const header: JWTHeader = JSON.parse(headerJson)
    const payload: JWTPayload = JSON.parse(payloadJson)

    // Verify algorithm
    if (header.alg !== 'RS256') {
      return null
    }

    // Verify expiration
    if (payload.exp * 1000 < Date.now()) {
      return null
    }

    // Verify issuer
    const expectedIssuer = `https://securetoken.google.com/${projectId}`
    if (payload.iss !== expectedIssuer) {
      return null
    }

    // Verify audience
    if (payload.aud !== projectId) {
      return null
    }

    // Get Google's public keys and find the right one
    const keys = await getGooglePublicKeys()
    const key = keys.find((k) => k.kid === header.kid)

    if (!key) {
      return null
    }

    // Import the public key
    const publicKey = await importPublicKey(key)

    // Verify signature
    const signatureData = base64UrlToArrayBuffer(signatureB64)
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`)

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureData,
      signedData
    )

    if (!isValid) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

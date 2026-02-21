import { SignJWT, jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET || 'taban-south-sudan-health-2026-secret-key';
const JWT_SECRET = new TextEncoder().encode(secret);

const JWT_ISSUER = 'taban';
const JWT_AUDIENCE = 'taban-web';

if (typeof window === 'undefined' && secret === 'taban-south-sudan-health-2026-secret-key' && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY] JWT_SECRET not set. Set JWT_SECRET environment variable for production.');
}

/**
 * Check if Web Crypto API is available.
 * crypto.subtle is only available in secure contexts (HTTPS or localhost).
 * When accessing via HTTP on a LAN IP (e.g., phone on local network), it's unavailable.
 */
function hasCryptoSubtle(): boolean {
  return typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';
}

/**
 * Fallback token for non-secure contexts (development only).
 * Uses base64-encoded JSON — NOT cryptographically secure.
 * In production, always use HTTPS so jose/crypto.subtle works.
 */
function createFallbackToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const body = btoa(JSON.stringify({
    ...payload,
    iss: JWT_ISSUER,
    aud: JWT_AUDIENCE,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24h
  }));
  return `${header}.${body}.dev-fallback`;
}

function verifyFallbackToken(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || parts[2] !== 'dev-fallback') return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.iss !== JWT_ISSUER || payload.aud !== JWT_AUDIENCE) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createToken(user: { _id: string; username: string; role: string; name: string; hospitalId?: string; orgId?: string }): Promise<string> {
  const payload = {
    sub: user._id,
    username: user.username,
    role: user.role,
    name: user.name,
    hospitalId: user.hospitalId,
    orgId: user.orgId,
  };

  // Use jose when crypto.subtle is available (HTTPS / localhost / server-side)
  if (hasCryptoSubtle()) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(JWT_ISSUER)
      .setAudience(JWT_AUDIENCE)
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
  }

  // Fallback for non-secure contexts (HTTP on LAN — dev only)
  console.warn('[Auth] crypto.subtle unavailable (non-HTTPS). Using dev fallback token.');
  return createFallbackToken(payload);
}

export async function verifyToken(token: string): Promise<{
  sub: string;
  username: string;
  role: string;
  name: string;
  hospitalId?: string;
  orgId?: string;
} | null> {
  // Try jose first (works server-side and on HTTPS)
  if (hasCryptoSubtle()) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      return payload as {
        sub: string;
        username: string;
        role: string;
        name: string;
        hospitalId?: string;
        orgId?: string;
      };
    } catch {
      // Fall through to try fallback
    }
  }

  // Try fallback token (dev mode over HTTP)
  const fallback = verifyFallbackToken(token);
  if (fallback) {
    return {
      sub: fallback.sub as string,
      username: fallback.username as string,
      role: fallback.role as string,
      name: fallback.name as string,
      hospitalId: fallback.hospitalId as string | undefined,
      orgId: fallback.orgId as string | undefined,
    };
  }

  return null;
}

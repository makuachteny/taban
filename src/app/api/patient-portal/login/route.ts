import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getClientIp } from '@/lib/request-utils';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'taban-south-sudan-health-2026-secret-key'
);

// Rate limit: 10 attempts / 15 min / IP
const rateLimit: Record<string, { count: number; windowStart: number }> = {};
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit[ip];
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimit[ip] = { count: 1, windowStart: now };
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

/**
 * POST /api/patient-portal/login
 * Authenticates a patient by hospital number + phone, or name + DOB + phone.
 * Returns a JWT token for subsequent API calls.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: {
    hospitalNumber?: string;
    phone?: string;
    firstName?: string;
    surname?: string;
    dateOfBirth?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const phone = (body.phone || '').replace(/\s+/g, '').trim();

  try {
    // Dynamic import to avoid PouchDB SSR crash (same pattern as /api/patients)
    const { getAllPatients } = await import('@/lib/services/patient-service');
    const patients = await getAllPatients();
    let found = null;

    // Method 1: Hospital number (or geocode ID) + phone
    if (body.hospitalNumber) {
      const hn = body.hospitalNumber.trim().toUpperCase();
      found = patients.find((p) => {
        const pPhone = (p.phone || '').replace(/\s+/g, '');
        return (
          (p.hospitalNumber?.toUpperCase() === hn || p.geocodeId?.toUpperCase() === hn) &&
          pPhone === phone &&
          pPhone.length > 0
        );
      });
    }

    // Method 2: Name + DOB + phone
    if (!found && body.firstName && body.surname && body.dateOfBirth) {
      const fn = body.firstName.trim().toLowerCase();
      const sn = body.surname.trim().toLowerCase();
      const dob = body.dateOfBirth.trim();
      found = patients.find(
        (p) =>
          p.firstName?.toLowerCase() === fn &&
          p.surname?.toLowerCase() === sn &&
          p.dateOfBirth === dob &&
          p.phone?.replace(/\s+/g, '') === phone
      );
    }

    if (!found) {
      return NextResponse.json({ error: 'No matching patient found. Check your details.' }, { status: 401 });
    }

    // Issue a patient-scoped JWT (8 hour expiry)
    const token = await new SignJWT({
      sub: found._id,
      name: `${found.firstName} ${found.surname}`,
      hospitalNumber: found.hospitalNumber,
      role: 'patient',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('taban')
      .setAudience('taban-patient')
      .setExpirationTime('8h')
      .sign(JWT_SECRET);

    return NextResponse.json({
      token,
      patient: {
        id: found._id,
        firstName: found.firstName,
        surname: found.surname,
        hospitalNumber: found.hospitalNumber,
        phone: found.phone,
        dateOfBirth: found.dateOfBirth,
        gender: found.gender,
        registrationHospital: found.registrationHospital,
      },
    });
  } catch (err) {
    console.error('[patient-portal/login]', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

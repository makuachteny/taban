/**
 * Patient Portal API authentication helper.
 * Verifies JWT tokens issued to patients by /api/patient-portal/login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'taban-south-sudan-health-2026-secret-key'
);

export type PatientTokenPayload = {
  sub: string; // patient _id
  name: string;
  hospitalNumber: string;
  role: 'patient';
};

/**
 * Verify the patient JWT from the Authorization header.
 * Returns the payload or a 401 NextResponse.
 */
export async function verifyPatientToken(
  req: NextRequest
): Promise<PatientTokenPayload | NextResponse> {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  const token = auth.slice(7);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'taban',
      audience: 'taban-patient',
    });
    return payload as unknown as PatientTokenPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

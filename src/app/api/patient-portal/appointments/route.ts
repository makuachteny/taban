import { NextRequest, NextResponse } from 'next/server';
import { verifyPatientToken } from '@/lib/patient-portal-auth';

export async function GET(req: NextRequest) {
  const auth = await verifyPatientToken(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { getAppointmentsByPatient } = await import('@/lib/services/appointment-service');
    const appointments = await getAppointmentsByPatient(auth.sub);
    return NextResponse.json({ appointments });
  } catch (err) {
    console.error('[patient-portal/appointments]', err);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

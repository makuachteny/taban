import { NextRequest, NextResponse } from 'next/server';
import { verifyPatientToken } from '@/lib/patient-portal-auth';

export async function GET(req: NextRequest) {
  const auth = await verifyPatientToken(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { getMessagesByPatient } = await import('@/lib/services/message-service');
    const messages = await getMessagesByPatient(auth.sub);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[patient-portal/messages]', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * API: /api/messages
 * GET  — List messages by patient or doctor
 * POST — Create, update status, or delete messages
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent',
];

const WRITE_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const { getAllMessages, getMessagesByPatient, getMessagesByDoctor } = await import('@/lib/services/message-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const scope = buildScopeFromAuth(auth);
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    const doctorId = url.searchParams.get('doctorId');

    let messages;
    if (patientId) {
      messages = await getMessagesByPatient(patientId);
    } else if (doctorId) {
      messages = await getMessagesByDoctor(doctorId);
    } else {
      messages = await getAllMessages(scope);
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error('[API /messages GET]', err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, WRITE_ROLES)) return forbidden();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sanitizePayload } = await import('@/lib/validation');
    body = sanitizePayload(body);

    const action = body.action as string;

    // Update message status
    if (action === 'update-status' && body.messageId) {
      const { updateMessage } = await import('@/lib/services/message-service');
      const updated = await updateMessage(body.messageId as string, {
        status: body.status as any,
      } as any);
      if (!updated) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      return NextResponse.json({ message: updated });
    }

    // Delete message
    if (action === 'delete' && body.messageId) {
      const { deleteMessage } = await import('@/lib/services/message-service');
      const deleted = await deleteMessage(body.messageId as string);
      if (!deleted) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      return NextResponse.json({ deleted: true });
    }

    // Create new message
    if (!body.patientId || !body.content) {
      return NextResponse.json(
        { error: 'patientId and content are required' },
        { status: 400 }
      );
    }

    const { createMessage } = await import('@/lib/services/message-service');
    const message = await createMessage({
      patientId: body.patientId as string,
      fromDoctorId: (body.fromDoctorId as string) || auth.sub,
      content: body.content as string,
      messageType: (body.messageType as string) || 'general',
      sentAt: new Date().toISOString(),
    } as any);

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error('[API /messages POST]', err);
    return serverError();
  }
}

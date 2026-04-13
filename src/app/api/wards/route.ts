/**
 * API: /api/wards
 * GET  — List wards + beds + occupancy (supports ?facilityId=xxx)
 * POST — Create a new ward, manage beds, admit/discharge patients
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthPayload, unauthorized, forbidden, hasRole, serverError,
} from '@/lib/api-auth';
import type { UserRole } from '@/lib/db-types';

const READ_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'doctor', 'clinical_officer', 'nurse',
  'front_desk', 'medical_superintendent',
];

const MANAGE_ROLES: UserRole[] = [
  'super_admin', 'org_admin', 'nurse', 'medical_superintendent',
];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, READ_ROLES)) return forbidden();

    const {
      getAllWards, getBedsByWard, getOccupancyStats,
      getActiveAdmissions,
    } = await import('@/lib/services/ward-service');
    const { buildScopeFromAuth } = await import('@/lib/services/data-scope');

    const url = new URL(request.url);
    const facilityId = url.searchParams.get('facilityId') || auth.hospitalId || '';
    const view = url.searchParams.get('view'); // 'beds', 'occupancy', 'admissions'

    if (view === 'occupancy') {
      const stats = await getOccupancyStats(facilityId);
      return NextResponse.json(stats);
    }

    if (view === 'admissions') {
      const scope = buildScopeFromAuth(auth);
      const admissions = await getActiveAdmissions(scope);
      return NextResponse.json({ admissions, total: admissions.length });
    }

    if (view === 'beds') {
      const wardId = url.searchParams.get('wardId');
      if (!wardId) {
        return NextResponse.json({ error: 'wardId required for beds view' }, { status: 400 });
      }
      const beds = await getBedsByWard(wardId);
      return NextResponse.json({ beds, total: beds.length });
    }

    // Default: list wards
    const scope = buildScopeFromAuth(auth);
    const wards = await getAllWards(scope);
    return NextResponse.json({ wards, total: wards.length });
  } catch (err) {
    console.error('[API /wards GET]', err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthPayload(request);
    if (!auth) return unauthorized();
    if (!hasRole(auth, MANAGE_ROLES)) return forbidden();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { sanitizePayload } = await import('@/lib/validation');
    body = sanitizePayload(body);

    const action = body.action as string;

    // Admit patient
    if (action === 'admit') {
      if (!body.patientId || !body.wardId || !body.admittingDiagnosis) {
        return NextResponse.json(
          { error: 'patientId, wardId, and admittingDiagnosis are required' },
          { status: 400 }
        );
      }
      const { admitPatient } = await import('@/lib/services/ward-service');
      const admission = await admitPatient({
        patientId: body.patientId as string,
        patientName: (body.patientName as string) || '',
        hospitalNumber: body.hospitalNumber as string | undefined,
        wardId: body.wardId as string,
        wardName: (body.wardName as string) || '',
        bedId: body.bedId as string | undefined,
        bedNumber: body.bedNumber as string | undefined,
        facilityId: (body.facilityId as string) || auth.hospitalId || '',
        facilityName: (body.facilityName as string) || '',
        facilityLevel: (body.facilityLevel as any) || 'county',
        admittedBy: auth.sub,
        admittedByName: auth.name,
        attendingPhysician: (body.attendingPhysician as string) || auth.sub,
        attendingPhysicianName: (body.attendingPhysicianName as string) || auth.name,
        admittingDiagnosis: body.admittingDiagnosis as string,
        icd11Code: body.icd11Code as string | undefined,
        severity: (body.severity as any) || 'moderate',
        isolationRequired: body.isolationRequired as boolean | undefined,
        isolationReason: body.isolationReason as string | undefined,
        state: (body.state as string) || '',
        county: body.county as string | undefined,
        orgId: (body.orgId as string) || auth.orgId,
      });
      return NextResponse.json({ admission }, { status: 201 });
    }

    // Discharge patient
    if (action === 'discharge') {
      if (!body.admissionId) {
        return NextResponse.json(
          { error: 'admissionId is required' },
          { status: 400 }
        );
      }
      const { dischargePatient } = await import('@/lib/services/ward-service');
      const result = await dischargePatient(
        body.admissionId as string,
        {
          dischargeType: (body.dischargeType as any) || 'regular',
          dischargeDiagnosis: body.dischargeDiagnosis as string | undefined,
          dischargeIcd11: body.dischargeIcd11 as string | undefined,
          dischargeSummary: body.dischargeSummary as string | undefined,
          dischargedBy: auth.sub,
          dischargedByName: auth.name,
          followUpRequired: body.followUpRequired as boolean | undefined,
          followUpDate: body.followUpDate as string | undefined,
          followUpInstructions: body.followUpInstructions as string | undefined,
        },
      );
      if (!result) return NextResponse.json({ error: 'Admission not found' }, { status: 404 });
      return NextResponse.json({ admission: result });
    }

    // Update bed status
    if (action === 'update_bed') {
      if (!body.bedId || !body.status) {
        return NextResponse.json(
          { error: 'bedId and status are required' },
          { status: 400 }
        );
      }
      const { updateBedStatus } = await import('@/lib/services/ward-service');
      const bed = await updateBedStatus(
        body.bedId as string,
        body.status as Parameters<typeof updateBedStatus>[1],
      );
      if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
      return NextResponse.json({ bed });
    }

    // Create ward
    if (!body.name || !body.facilityId) {
      return NextResponse.json(
        { error: 'name and facilityId are required' },
        { status: 400 }
      );
    }

    const { createWard } = await import('@/lib/services/ward-service');
    const ward = await createWard({
      name: body.name as string,
      wardType: (body.wardType as any) || 'general_male',
      facilityId: body.facilityId as string,
      facilityName: (body.facilityName as string) || '',
      facilityLevel: (body.facilityLevel as any) || 'county',
      totalBeds: Number(body.totalBeds) || 10,
      isActive: true,
      orgId: (body.orgId as string) || auth.orgId,
    });

    return NextResponse.json({ ward }, { status: 201 });
  } catch (err) {
    console.error('[API /wards POST]', err);
    return serverError();
  }
}

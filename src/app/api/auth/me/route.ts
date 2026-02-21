import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-token';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('taban-token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      _id: payload.sub,
      username: payload.username,
      name: payload.name,
      role: payload.role,
      hospitalId: payload.hospitalId,
      orgId: payload.orgId,
    },
  });
}

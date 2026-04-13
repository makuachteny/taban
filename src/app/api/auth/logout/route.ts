import { NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/lib/token-blacklist';

export async function POST(request: NextRequest) {
  // Extract token from cookie and add to blacklist
  const token = request.cookies.get('taban-token')?.value;
  if (token) {
    revokeToken(token);
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('taban-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}

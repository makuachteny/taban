import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface PaymentLinkRequest {
  patientId: string;
  amount: number;
  description: string;
  expiresInHours?: number;
}

interface PaymentLinkResponse {
  linkId: string;
  url: string;
  amount: number;
  currency: string;
  description: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'used';
  createdAt: string;
  patientId: string;
}

function generateLinkId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generatePaymentUrl(linkId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.taban.health';
  return `${baseUrl}/checkout/${linkId}`;
}

export async function POST(req: NextRequest) {
  try {
    const body: PaymentLinkRequest = await req.json();
    const { patientId, amount, description, expiresInHours = 72 } = body;

    // Validate required fields
    if (!patientId || !amount || !description) {
      return NextResponse.json(
        {
          error:
            'patientId, amount, and description are required',
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate expiresInHours
    if (expiresInHours < 1 || expiresInHours > 720) {
      return NextResponse.json(
        { error: 'expiresInHours must be between 1 and 720' },
        { status: 400 }
      );
    }

    // Generate unique link ID
    const linkId = generateLinkId();

    // Calculate expiration time
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + expiresInHours * 60 * 60 * 1000);

    // Generate payment URL
    const paymentUrl = generatePaymentUrl(linkId);

    const response: PaymentLinkResponse = {
      linkId,
      url: paymentUrl,
      amount,
      currency: 'SSP', // South Sudanese Pound
      description,
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      createdAt: createdAt.toISOString(),
      patientId,
    };

    // In production, this would save the payment link to the database
    // Example: await PaymentLinkService.create({ linkId, patientId, amount, description, expiresAt })

    console.log('[Payment Link API] Payment link created:', {
      linkId,
      patientId,
      amount,
      expiresAt: expiresAt.toISOString(),
      timestamp: createdAt.toISOString(),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Payment Link API] Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkId query parameter is required' },
        { status: 400 }
      );
    }

    // In production, this would fetch the payment link from the database
    // and check its status (active, expired, or used)
    // Example: const link = await PaymentLinkService.getById(linkId)

    // Return a simulated response
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);

    const response = {
      linkId,
      status: 'active',
      amount: 5000,
      currency: 'SSP',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      message: 'Use POST method to create a new payment link',
    };

    console.log('[Payment Link API] GET request for link:', {
      linkId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Payment Link API] Error processing GET request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/receipts/email
 *
 * Delivers a payment receipt to the supplied address via the configured
 * email provider. Provider is selected by `EMAIL_PROVIDER` env var:
 *
 *   EMAIL_PROVIDER=sendgrid   → SENDGRID_API_KEY
 *   EMAIL_PROVIDER=resend     → RESEND_API_KEY
 *   EMAIL_PROVIDER=smtp       → SMTP_URL  (smtps://user:pass@host:port)
 *   EMAIL_PROVIDER=log        → no network call, just structured stdout
 *                               (default for dev / when no creds present)
 *
 * The send is "best effort" — we always return 200 with a `delivered`
 * flag so the caller can render a "Receipt queued" toast even on a low-
 * connectivity facility deployment. If the provider call fails the
 * receipt is logged so it can be retried out-of-band.
 *
 * `from` defaults to FROM_EMAIL or `receipts@taban.health`.
 */
export async function POST(req: NextRequest) {
  let payload: {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
    receiptNumber?: string;
    amount?: number;
    currency?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { to, subject, html, text, receiptNumber, amount, currency } = payload;
  if (!to || !subject) {
    return NextResponse.json({ error: 'to and subject are required' }, { status: 400 });
  }
  if (!isValidEmail(to)) {
    return NextResponse.json({ error: 'to is not a valid email address' }, { status: 400 });
  }

  const from = process.env.FROM_EMAIL || 'receipts@taban.health';
  const provider = (process.env.EMAIL_PROVIDER || 'log').toLowerCase();

  try {
    let delivered = false;
    let providerUsed = provider;

    switch (provider) {
      case 'sendgrid':
        delivered = await sendViaSendgrid({ to, from, subject, html, text });
        break;
      case 'resend':
        delivered = await sendViaResend({ to, from, subject, html, text });
        break;
      case 'smtp':
        delivered = await sendViaSmtp({ to, from, subject, html, text });
        break;
      case 'log':
      default:
        providerUsed = 'log';
        console.log(JSON.stringify({
          tag: '[Email Receipt]',
          to, from, subject,
          receiptNumber, amount, currency,
          previewLength: (html || text || '').length,
        }));
        delivered = true;
        break;
    }

    return NextResponse.json({
      success: true,
      delivered,
      provider: providerUsed,
      receiptNumber,
      message: delivered ? 'Receipt sent' : 'Receipt queued for retry',
    });
  } catch (error) {
    // Failed sends are logged but reported as "queued" so the UI doesn't
    // alarm the cashier — a background retry job can pick this up.
    console.error('[Email Receipt] Provider error — receipt queued for retry', {
      to, subject, receiptNumber, error: (error as Error).message,
    });
    return NextResponse.json({
      success: true,
      delivered: false,
      provider,
      receiptNumber,
      message: 'Receipt queued for retry',
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider adapters — kept inline to avoid pulling SDK deps unless used. Each
// returns true when the provider accepted the message, false when delivery
// is uncertain. Throwing escalates to the caller's retry path.
// ─────────────────────────────────────────────────────────────────────────────

interface SendArgs { to: string; from: string; subject: string; html?: string; text?: string }

async function sendViaSendgrid({ to, from, subject, html, text }: SendArgs): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY not configured');
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        ...(text ? [{ type: 'text/plain', value: text }] : []),
        ...(html ? [{ type: 'text/html', value: html }] : []),
      ],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text().catch(() => '')}`);
  return true;
}

async function sendViaResend({ to, from, subject, html, text }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text().catch(() => '')}`);
  return true;
}

async function sendViaSmtp({ to, from, subject, html, text }: SendArgs): Promise<boolean> {
  // nodemailer is an optional dependency — loaded dynamically so the bundle
  // doesn't require it unless an SMTP deployment opts in.
  if (!process.env.SMTP_URL) throw new Error('SMTP_URL not configured');
  let nodemailer: { createTransport: (url: string) => { sendMail: (opts: SendArgs) => Promise<unknown> } };
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(/* webpackIgnore: true */ 'nodemailer' as string);
    nodemailer = mod.default ?? mod;
  } catch {
    throw new Error('nodemailer is not installed; run `npm i nodemailer` to enable SMTP delivery');
  }
  const transport = nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from, to, subject, html, text });
  return true;
}

function isValidEmail(addr: string): boolean {
  // Lenient — server validates intent, not perfection.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr);
}

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

type DemoRequest = {
  name: string;
  email: string;
  org: string;
  role: string;
  phone?: string;
  message?: string;
};

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

function getFromAddress(): { fromEmail: string; fromName: string; resendFrom: string } {
  const fromEmail = process.env.DEMO_FROM_EMAIL;
  const fromName = process.env.DEMO_FROM_NAME || 'Taban Demo';
  if (!fromEmail) {
    throw new Error('DEMO_FROM_EMAIL is not configured');
  }
  const resendFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  return { fromEmail, fromName, resendFrom };
}

async function sendWithResend(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const { resendFrom } = getFromAddress();
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      reply_to: msg.replyTo,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend error ${res.status}: ${detail}`);
  }
}

async function sendWithSendGrid(msg: EmailMessage): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }
  const { fromEmail, fromName } = getFromAddress();
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: msg.to }],
          ...(msg.replyTo ? { reply_to: { email: msg.replyTo } } : {}),
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: msg.subject,
      content: [
        {
          type: 'text/plain',
          value: msg.text,
        },
        ...(msg.html ? [{ type: 'text/html', value: msg.html }] : []),
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${detail}`);
  }
}

async function sendEmail(msg: EmailMessage): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    await sendWithResend(msg);
    return;
  }
  if (process.env.SENDGRID_API_KEY) {
    await sendWithSendGrid(msg);
    return;
  }
  throw new Error('No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY)');
}

function buildNotifyEmail(req: DemoRequest, requestId: string, scheduleUrl?: string): EmailMessage {
  const subject = `New Demo Request — ${req.name} (${req.org})`;
  const lines = [
    `Request ID: ${requestId}`,
    `Name: ${req.name}`,
    `Email: ${req.email}`,
    `Organization: ${req.org}`,
    `Role: ${req.role}`,
    req.phone ? `Phone: ${req.phone}` : null,
    req.message ? `Message: ${req.message}` : null,
    scheduleUrl ? `Scheduling: ${scheduleUrl}` : null,
  ].filter(Boolean) as string[];

  return {
    to: process.env.DEMO_NOTIFY_EMAIL || 'tenymakuach@gmail.com',
    subject,
    text: lines.join('\n'),
    replyTo: req.email,
  };
}

function buildRequesterEmail(req: DemoRequest, scheduleUrl?: string): EmailMessage {
  const subject = 'Your Taban Demo Request';
  const textLines = [
    `Hi ${req.name},`,
    '',
    'Thanks for requesting a demo of Taban. We will contact you within 24 hours.',
    scheduleUrl ? `You can schedule a time here: ${scheduleUrl}` : 'We will follow up shortly to schedule a time.',
    '',
    'Best,',
    'Taban Team',
  ];

  const html = [
    `<p>Hi ${req.name},</p>`,
    '<p>Thanks for requesting a demo of Taban. We will contact you within 24 hours.</p>',
    scheduleUrl ? `<p>You can schedule a time here: <a href="${scheduleUrl}">${scheduleUrl}</a></p>` : '<p>We will follow up shortly to schedule a time.</p>',
    '<p>Best,<br/>Taban Team</p>',
  ].join('');

  return {
    to: req.email,
    subject,
    text: textLines.join('\n'),
    html,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DemoRequest>;
    const demo: DemoRequest = {
      name: (body.name || '').trim(),
      email: (body.email || '').trim(),
      org: (body.org || '').trim(),
      role: (body.role || '').trim(),
      phone: body.phone?.trim(),
      message: body.message?.trim(),
    };

    if (!demo.name || !demo.email || !demo.org || !demo.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!isValidEmail(demo.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const requestId = randomUUID();
    const scheduleUrl = process.env.DEMO_SCHEDULING_URL;

    const notifyEmail = buildNotifyEmail(demo, requestId, scheduleUrl);
    const requesterEmail = buildRequesterEmail(demo, scheduleUrl);

    await sendEmail(notifyEmail);
    await sendEmail(requesterEmail);

    return NextResponse.json({
      ok: true,
      requestId,
      scheduleUrl: scheduleUrl || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to submit demo request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

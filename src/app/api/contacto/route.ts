import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validators';

// Resend is used for transactional email notifications.
// Installed via: npm install resend (Phase 2.5)
let resendClient: import('resend').Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend') as typeof import('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function buildContactHtml(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
}): string {
  return `
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;width:160px">Nombre</td><td style="padding:8px;border:1px solid #ddd">${data.nombre}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Email</td><td style="padding:8px;border:1px solid #ddd">${data.email}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Teléfono</td><td style="padding:8px;border:1px solid #ddd">${data.telefono ?? '—'}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;vertical-align:top">Mensaje</td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${data.mensaje}</td></tr>
    </table>
  `;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const resend = getResend();

  if (!resend) {
    // Development fallback — log to console when RESEND_API_KEY is not configured
    console.log('[contacto] RESEND_API_KEY no configurado. Datos recibidos:', data);
    return NextResponse.json({ success: true });
  }

  try {
    await resend.emails.send({
      from: 'Brisal Web <noreply@brisalbysalvador.com>',
      to: process.env.RESEND_TO_EMAIL ?? '',
      subject: `Nuevo mensaje de contacto — ${data.nombre}`,
      html: buildContactHtml(data),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contacto] Error al enviar email:', err);
    return NextResponse.json({ error: 'No se pudo enviar el mensaje. Intenta de nuevo.' }, { status: 500 });
  }
}

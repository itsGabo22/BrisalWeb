import { NextRequest, NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validators';
import { getResend } from '@/lib/email/resend-client';
import { escapeHtml } from '@/lib/email/escape';
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';

function buildContactHtml(data: {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
}): string {
  return `
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;width:160px">Nombre</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.nombre)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Email</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.email)}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Teléfono</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.telefono ?? '—')}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;vertical-align:top">Mensaje</td><td style="padding:8px;border:1px solid #ddd;white-space:pre-wrap">${escapeHtml(data.mensaje)}</td></tr>
    </table>
  `;
}

export async function POST(request: NextRequest) {
  /**
   * Sends mail on every call, so an unthrottled form is a free relay for
   * flooding the client's inbox. Five an hour per connection.
   */
  const ip = getClientIp(request);
  if (ip) {
    const limit = await checkRateLimit(RATE_LIMITS.contact, `ip:${ip}`, ip);
    if (!limit.allowed) return rateLimitResponse(limit);
  }

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
      subject: `Nuevo mensaje de contacto — ${escapeHtml(data.nombre)}`,
      html: buildContactHtml(data),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contacto] Error al enviar email:', err);
    return NextResponse.json({ error: 'No se pudo enviar el mensaje. Intenta de nuevo.' }, { status: 500 });
  }
}

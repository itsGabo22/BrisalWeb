import { NextRequest, NextResponse } from 'next/server';
import { registroMayoristaSchema } from '@/lib/validators';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

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

function buildNotificationHtml(data: {
  nombre: string;
  nombreNegocio: string;
  nitCedula: string;
  email: string;
  telefono: string;
  ciudad: string;
}): string {
  return `
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd;width:180px">Nombre completo</td><td style="padding:8px;border:1px solid #ddd">${data.nombre}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Nombre del negocio</td><td style="padding:8px;border:1px solid #ddd">${data.nombreNegocio}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">NIT / Cédula</td><td style="padding:8px;border:1px solid #ddd">${data.nitCedula}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Email</td><td style="padding:8px;border:1px solid #ddd">${data.email}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Teléfono</td><td style="padding:8px;border:1px solid #ddd">${data.telefono}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;background:#f5f5f5;border:1px solid #ddd">Ciudad</td><td style="padding:8px;border:1px solid #ddd">${data.ciudad}</td></tr>
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

  const parsed = registroMayoristaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { nombre, nombreNegocio, nitCedula, ciudad, telefono, email, password } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta registrada con este correo.' },
      { status: 409 },
    );
  }

  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    const isDuplicate = authError?.message
      ?.toLowerCase()
      .includes('already been registered');
    return NextResponse.json(
      {
        error: isDuplicate
          ? 'Ya existe una cuenta registrada con este correo.'
          : 'No se pudo crear la cuenta. Intenta de nuevo.',
      },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  try {
    await prisma.user.create({
      data: {
        authId: authData.user.id,
        email,
        name: nombre,
        role: 'MAYORISTA',
        businessName: nombreNegocio,
        taxId: nitCedula,
        city: ciudad,
        phone: telefono,
        approved: false,
      },
    });
  } catch (err) {
    console.error('[registro-mayorista] Error al crear el registro:', err);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
    return NextResponse.json(
      { error: 'No se pudo crear la cuenta. Intenta de nuevo.' },
      { status: 500 },
    );
  }

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: 'Brisal Web <noreply@brisalbysalvador.com>',
        to: process.env.RESEND_TO_EMAIL ?? '',
        subject: `Nueva solicitud de mayorista — ${nombreNegocio}`,
        html: buildNotificationHtml({
          nombre,
          nombreNegocio,
          nitCedula,
          email,
          telefono,
          ciudad,
        }),
      });
    } catch (err) {
      console.error('[registro-mayorista] Error al enviar email de notificación:', err);
    }
  } else {
    console.log('[registro-mayorista] RESEND_API_KEY no configurado. Nueva cuenta:', email);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

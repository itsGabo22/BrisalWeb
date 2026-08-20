import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { toWholesaler } from '@/lib/repositories/mappers';
import { getResend } from '@/lib/email/resend-client';

function buildApprovalHtml(nombre: string): string {
  return `
    <div style="font-family:sans-serif;font-size:14px;color:#2A2521">
      <p>Hola ${nombre},</p>
      <p>¡Tu cuenta mayorista en <strong>Brisal by Salvador</strong> fue aprobada! Ya puedes iniciar sesión y ver los precios mayoristas en todo el catálogo.</p>
      <p style="margin:24px 0">
        <a href="https://brisalbysalvador.com/login" style="background:#C9A96E;color:#2A2521;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Iniciar sesión</a>
      </p>
      <p style="color:#6B6259;font-size:12px">Si el botón no funciona, visita brisalbysalvador.com/login</p>
    </div>
  `;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado || !['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido o no provisto' },
        { status: 400 },
      );
    }

    const wholesaler = await prisma.user.findUnique({ where: { id } });
    if (!wholesaler || wholesaler.role !== 'MAYORISTA') {
      return NextResponse.json(
        { error: 'Solicitud mayorista no encontrada' },
        { status: 404 },
      );
    }

    /**
     * `rejectedAt` is what makes RECHAZADO a real, persisted state rather than
     * the client-side illusion it used to be: this branch used to
     * `prisma.user.delete(...)` immediately, with no confirmation and no
     * check for attached data, and the admin's "Rechazadas" tab only looked
     * populated because the browser kept the deleted row in memory until the
     * next reload. See the schema comment on `User.rejectedAt`. Deletion is
     * now a SEPARATE, explicit action -- the DELETE handler below.
     */
    if (estado === 'RECHAZADO') {
      const updated = await prisma.user.update({
        where: { id },
        data: { approved: false, rejectedAt: new Date() },
      });
      return NextResponse.json(toWholesaler(updated));
    }

    if (estado === 'APROBADO') {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          approved: true,
          rejectedAt: null,
          // Reset on every transition INTO approved, not just the first one:
          // a wholesaler reverted to pending or rejected and then reapproved
          // sees the welcome message again, which reads as a real "you're
          // back in" moment rather than a one-time fluke tied to account
          // creation.
          wholesaleWelcomeSeenAt: null,
        },
      });

      // Non-blocking by design: the approval itself has already committed
      // above. A wholesaler who never gets the email but can still log in and
      // see mayorista pricing is a much better failure mode than an approval
      // that silently didn't happen because Resend hiccuped.
      const resend = getResend();
      if (resend) {
        try {
          await resend.emails.send({
            from: 'Brisal Web <noreply@brisalbysalvador.com>',
            to: updated.email,
            subject: '¡Tu cuenta mayorista fue aprobada!',
            html: buildApprovalHtml(updated.name ?? 'mayorista'),
          });
        } catch (err) {
          console.error('[admin/mayoristas] Error al enviar email de aprobación:', err);
        }
      } else {
        console.log('[admin/mayoristas] RESEND_API_KEY no configurado. Aprobado:', updated.email);
      }

      return NextResponse.json(toWholesaler(updated));
    }

    // PENDIENTE -- "Volver a Pendientes", from either APROBADO or RECHAZADO.
    const updated = await prisma.user.update({
      where: { id },
      data: { approved: false, rejectedAt: null },
    });
    return NextResponse.json(toWholesaler(updated));
  } catch (err) {
    console.error('[admin/mayoristas] Error al actualizar estado de mayorista:', err);
    return NextResponse.json(
      { error: 'Error al actualizar estado de mayorista' },
      { status: 500 },
    );
  }
}

/**
 * Deletes a wholesale application -- scoped to REJECTED records only.
 *
 * Deliberately not extended to APROBADO or PENDIENTE: an approved account is
 * a real, active user, and a pending one hasn't been decided yet. Only a
 * rejected application is safe to consider "over" -- and even then, only if
 * nothing else in the system points at it. `Order.wholesaleUserId` has no
 * database-level foreign key (see the schema comment on `Order`), so nothing
 * would stop a delete from orphaning real order history if this check were
 * skipped.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const wholesaler = await prisma.user.findUnique({ where: { id } });
    if (!wholesaler || wholesaler.role !== 'MAYORISTA') {
      return NextResponse.json(
        { error: 'Solicitud mayorista no encontrada' },
        { status: 404 },
      );
    }

    if (!wholesaler.rejectedAt) {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar solicitudes rechazadas' },
        { status: 400 },
      );
    }

    const orderCount = await prisma.order.count({
      where: { wholesaleUserId: id },
    });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: esta cuenta tiene ${orderCount} pedido(s) asociado(s) en el historial.`,
        },
        { status: 409 },
      );
    }

    await prisma.user.delete({ where: { id } });
    // Best-effort: the Prisma row is the source of truth for the admin list,
    // so a failure here leaves an orphaned Supabase auth user rather than a
    // visible inconsistency -- the same trade-off the pre-existing reject
    // flow already made.
    await createAdminClient()
      .auth.admin.deleteUser(wholesaler.authId)
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/mayoristas] Error al eliminar solicitud rechazada:', err);
    return NextResponse.json(
      { error: 'Error al eliminar la solicitud' },
      { status: 500 },
    );
  }
}

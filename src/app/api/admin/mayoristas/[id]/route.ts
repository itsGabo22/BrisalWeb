import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import { toWholesaler } from '@/lib/repositories/mappers';
import { getResend } from '@/lib/email/resend-client';
import { wholesalerStatusSchema } from '@/lib/validators';

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 });
    }

    // `const { estado } = body` destructured an `any` and then checked it
    // against a literal array. Same three values, now declared once in the
    // validators module instead of inline here.
    const parsed = wholesalerStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Estado inválido o no provisto' },
        { status: 400 },
      );
    }
    const { estado } = parsed.data;

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
        data: { approved: false, rejectedAt: new Date(), revokedAt: null },
      });
      return NextResponse.json(toWholesaler(updated));
    }

    /**
     * ─── Revocation: taking access away from an ACTIVE wholesaler ───────────
     *
     * A STATUS CHANGE, never a delete. This account has been buying at
     * wholesale prices, so `Order.wholesaleUserId` very likely points at it —
     * and that column has no database-level foreign key (see the schema comment
     * on `Order`), so deleting the row would silently orphan real order
     * history rather than being refused. Past orders must survive untouched;
     * only future access is withdrawn.
     *
     * `approved: false` is the whole mechanism. `getSessionResult` reads exactly
     * that flag, and it is re-read from the database on every price check, so
     * there is no stale-session window in which the revoked account keeps
     * seeing wholesale prices — including the server-side re-pricing in
     * `quoteCartLines`, which is what stops an already-open cart from checking
     * out at the old rate.
     *
     * Guarded to APROBADO. Revoking a pending application is meaningless (there
     * is no access to take) and revoking a rejected one would move it out of a
     * state the delete flow depends on. The UI only renders the button for
     * approved accounts; this is the half that cannot be bypassed.
     */
    if (estado === 'REVOCADO') {
      if (!wholesaler.approved || wholesaler.rejectedAt) {
        return NextResponse.json(
          { error: 'Solo se puede revocar el acceso de una cuenta aprobada' },
          { status: 400 },
        );
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { approved: false, revokedAt: new Date(), rejectedAt: null },
      });
      return NextResponse.json(toWholesaler(updated));
    }

    if (estado === 'APROBADO') {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          approved: true,
          rejectedAt: null,
          // Clearing this is what makes a revoked wholesaler RE-APPROVABLE:
          // reinstating someone is the same status change as approving them the
          // first time, and they keep their id, so their order history stays
          // attached. The welcome message resets too, which reads correctly as
          // "you're back in".
          revokedAt: null,
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

    // PENDIENTE -- "Volver a Pendientes", from APROBADO, RECHAZADO or REVOCADO.
    const updated = await prisma.user.update({
      where: { id },
      data: { approved: false, rejectedAt: null, revokedAt: null },
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
 * Deliberately not extended to APROBADO, PENDIENTE or REVOCADO: an approved
 * account is a real, active user, a pending one hasn't been decided yet, and a
 * REVOKED one is a formerly active customer who almost certainly has order
 * history -- which is the whole reason revocation is a status change and not
 * this. Only a rejected application is safe to consider "over" -- and even
 * then, only if nothing else in the system points at it.
 * `Order.wholesaleUserId` has no database-level foreign key (see the schema
 * comment on `Order`), so nothing would stop a delete from orphaning real order
 * history if this check were skipped.
 *
 * The `!wholesaler.rejectedAt` guard below already excludes REVOCADO for free,
 * because the transitions keep `rejectedAt` and `revokedAt` mutually exclusive.
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

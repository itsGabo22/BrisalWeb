import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Wholesaler } from '@/types';
import type { User } from '@prisma/client';

function toWholesaler(user: User, estado: Wholesaler['estado']): Wholesaler {
  return {
    id: user.id,
    nombre: user.name ?? '',
    negocio: user.businessName ?? '',
    nit: user.taxId ?? '',
    email: user.email,
    telefono: user.phone ?? '',
    ciudad: user.city ?? '',
    mensaje: user.notes,
    fechaRegistro: user.createdAt.toISOString(),
    estado,
  };
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

    if (estado === 'RECHAZADO') {
      // No RECHAZADO status exists on User (approved/pending only) — a rejection
      // revokes the account entirely rather than leaving a third persisted state.
      await prisma.user.delete({ where: { id } });
      await createAdminClient()
        .auth.admin.deleteUser(wholesaler.authId)
        .catch(() => {});
      return NextResponse.json(toWholesaler(wholesaler, 'RECHAZADO'));
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { approved: estado === 'APROBADO' },
    });

    return NextResponse.json(toWholesaler(updated, estado));
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar estado de mayorista' },
      { status: 500 },
    );
  }
}

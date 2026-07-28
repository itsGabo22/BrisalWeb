import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Wholesaler } from '@/types';
import type { User } from '@prisma/client';

function toWholesaler(user: User): Wholesaler {
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
    estado: user.approved ? 'APROBADO' : 'PENDIENTE',
  };
}

export async function GET() {
  const wholesalers = await prisma.user.findMany({
    where: { role: 'MAYORISTA' },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(wholesalers.map(toWholesaler));
}

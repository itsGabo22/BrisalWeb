import { NextResponse } from 'next/server';
import { wholesalerStore } from '@/lib/stores/adminStore';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;

    if (!estado || !['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido o no provisto' },
        { status: 400 }
      );
    }

    const updated = wholesalerStore.updateStatus(id, estado);
    if (!updated) {
      return NextResponse.json(
        { error: 'Solicitud mayorista no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar estado de mayorista' },
      { status: 500 }
    );
  }
}

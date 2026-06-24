import { NextResponse } from 'next/server';
import { categoryRepository } from '@/lib/repositories';

export async function GET() {
  try {
    const tree = await categoryRepository.getTree();
    return NextResponse.json({
      status: 'ok',
      data: tree,
    });
  } catch (err) {
    console.error('[categorias] Error al obtener árbol de categorías:', err);
    return NextResponse.json({ status: 'error', message: 'Error interno del servidor' }, { status: 500 });
  }
}

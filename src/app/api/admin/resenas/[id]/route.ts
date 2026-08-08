import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { deleteFromStorageByUrl } from '@/lib/supabase/storage';

/** Admin-gated by `src/proxy.ts`, which guards every `/api/admin` path. */
export const runtime = 'nodejs';

const ACTIONS = { approve: 'APPROVED', reject: 'REJECTED' } as const;
type Action = keyof typeof ACTIONS;

/**
 * The product page is a Server Component reading approved reviews, so a status
 * change is invisible until its cache is dropped. Both directions need it:
 * approving has to make a review appear, and rejecting an already-approved one
 * has to make it disappear again.
 */
function revalidateProduct(slug: string) {
  try {
    revalidatePath(`/producto/${slug}`);
    // The catalog cards carry a rating average, so they go stale too.
    revalidatePath('/catalogo');
  } catch (err) {
    // Never turn a successful moderation into a client-visible failure.
    console.error('[admin/resenas] revalidatePath failed (non-fatal):', err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { action } = (await request.json()) as { action?: string };

    if (!action || !(action in ACTIONS)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({
      where: { id },
      include: { product: { select: { slug: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status: ACTIONS[action as Action] },
    });

    revalidateProduct(existing.product.slug);

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error('[admin/resenas/[id]] Error al moderar la reseña:', err);
    return NextResponse.json({ error: 'Error al procesar la reseña' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await prisma.review.findUnique({
      where: { id },
      include: { product: { select: { slug: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    // Photos go with the row — leaving them orphaned in the bucket would mean
    // spam images stay publicly reachable by URL after the review is gone.
    for (const url of existing.imageUrls) {
      await deleteFromStorageByUrl('review-images', url);
    }
    await prisma.review.delete({ where: { id } });

    revalidateProduct(existing.product.slug);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/resenas/[id]] Error al eliminar la reseña:', err);
    return NextResponse.json({ error: 'Error al eliminar la reseña' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { ZodError } from 'zod';

/**
 * Turning save failures into something the client can act on.
 *
 * Both product routes used to collapse every failure into one of two opaque
 * strings — `"Datos inválidos"` for a Zod miss and `"Error al crear producto"`
 * for anything Prisma threw — and the admin form renders that message verbatim.
 * So a product rejected for having no images, a duplicate SKU, and a deleted
 * category all looked identical in the UI: a red banner naming no field and
 * suggesting no fix. That is what left the client stuck, retrying the same
 * payload.
 *
 * The two exported helpers here name the offending field instead. They live in
 * one module because POST and PATCH must not drift apart on this.
 */

/**
 * Spanish labels for the fields the admin form actually shows, so a validation
 * message reads like the form and not like the schema. Anything missing falls
 * back to the raw path, which is still better than no field at all.
 */
const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  price: 'Precio',
  comparePrice: 'Precio comparativo',
  wholesalePrice: 'Precio mayorista',
  categoryId: 'Categoría',
  sku: 'Referencia (SKU)',
  stock: 'Stock',
  imageUrls: 'Imágenes',
  colorName: 'Color principal',
  colorHex: 'Color principal',
  description: 'Descripción',
  materialIds: 'Materiales',
  colorVariants: 'Colores adicionales',
};

/**
 * Labels for fields INSIDE a `colorVariants` entry. Separate from the top-level
 * map because the same key means something different there: a product's
 * `colorHex` is its primary colour, while a variant's is just "Color".
 */
const VARIANT_FIELD_LABELS: Record<string, string> = {
  colorName: 'Nombre del color',
  colorHex: 'Color',
  imageUrls: 'Imágenes',
  price: 'Precio',
  wholesalePrice: 'Precio mayorista',
  stock: 'Stock',
};

function labelFor(path: readonly (string | number | symbol)[]): string {
  if (path.length === 0) return 'Formulario';

  const [head, ...rest] = path;
  const key = String(head);
  const base = FIELD_LABELS[key] ?? key;

  // `colorVariants.1.colorHex` → "Colores adicionales (color 2) → Color".
  // The index is shown 1-based because that is how the editor numbers them.
  if (key === 'colorVariants' && typeof rest[0] === 'number') {
    const nestedKey = rest[1] === undefined ? undefined : String(rest[1]);
    const nested = nestedKey ? ` → ${VARIANT_FIELD_LABELS[nestedKey] ?? nestedKey}` : '';
    return `${base} (color ${rest[0] + 1})${nested}`;
  }

  return base;
}

/**
 * A 400 that names every field that failed, e.g.
 * `"Imágenes: Debes agregar al menos una imagen"`.
 *
 * `details` keeps the machine-readable issue list for anyone debugging; the
 * form only reads `error`. Uses `error.issues` rather than the Zod-3-era
 * `.format()` the routes used before, which produced a nested `_errors` blob
 * the client could not render.
 */
export function invalidProductDataResponse(error: ZodError): NextResponse {
  const messages = error.issues.map((issue) => `${labelFor(issue.path)}: ${issue.message}`);

  // Deduplicated: two issues on the same field with the same text (which
  // unions and refinements both produce) should not be listed twice.
  const unique = [...new Set(messages)];

  return NextResponse.json(
    {
      error:
        unique.length > 0
          ? `Revisa estos campos — ${unique.join(' · ')}`
          : 'Datos inválidos',
      details: error.issues,
    },
    { status: 400 },
  );
}

/**
 * Maps the Prisma failures a product save can realistically hit onto a specific
 * message and an honest status code. Returns `null` when the error is not one we
 * recognise, so the caller still logs it and answers 500 — a genuine unknown
 * should not be dressed up as a user error.
 *
 * Every code below was reproduced against the real schema, not guessed:
 *   P2002 → duplicate value in a `@unique` column (`sku`, or `slug` on a race)
 *   P2003 → foreign key: `categoryId` pointing at a deleted category
 *   P2025 → a required related record missing, which for us is
 *           `materials: { connect: … }` naming a material that no longer exists
 */
export function productWriteErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;

  const target = err.meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : typeof target === 'string' ? [target] : [];
  // The pg driver adapter reports the violated constraint here rather than in
  // `meta.target`, so check both before deciding which column collided.
  const constraint = JSON.stringify(err.meta ?? {});

  switch (err.code) {
    case 'P2002': {
      if (fields.includes('sku') || constraint.includes('Product_sku_key')) {
        return NextResponse.json(
          {
            error:
              'Ya existe otro producto con esa referencia (SKU). Cada producto necesita una referencia única — revísala o déjala vacía.',
          },
          { status: 409 },
        );
      }
      if (fields.includes('slug') || constraint.includes('Product_slug_key')) {
        return NextResponse.json(
          { error: 'Ya existe un producto con este nombre' },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: 'Ese valor ya está en uso por otro producto' },
        { status: 409 },
      );
    }

    case 'P2003':
      return NextResponse.json(
        {
          error:
            'La categoría seleccionada ya no existe. Recarga la página y elige una categoría de la lista.',
        },
        { status: 400 },
      );

    // Worded to cover both relations a product save connects — materials and
    // tags — because this module is shared by branches where only one of them
    // exists, and a message naming the wrong one is worse than a general one.
    case 'P2025':
      return NextResponse.json(
        {
          error:
            'Uno de los elementos seleccionados (material o etiqueta) ya no existe. Recarga la página y vuelve a elegirlos.',
        },
        { status: 400 },
      );

    default:
      return null;
  }
}

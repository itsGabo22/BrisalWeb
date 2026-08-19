import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import type { ZodError } from 'zod';

/**
 * Turning admin save failures into something the client can act on.
 *
 * This started as product-only (`product-errors.ts`) and was generalised the
 * first time a second route showed the same defect: every failure — a missing
 * image, a duplicate SKU, a deleted parent category — collapsed into one opaque
 * Spanish string that the admin form renders verbatim. A red banner naming no
 * field and suggesting no fix is what left the client retrying blindly.
 *
 * The core here is entity-agnostic; each route supplies its own labels and
 * messages via the config objects at the bottom. One module because the routes
 * must not drift apart on this, and because the next route to need it should
 * add a config rather than another copy of the logic.
 */

export type FieldLabels = Record<string, string>;

export interface InvalidDataOptions {
  /** Spanish label per top-level field, so the message reads like the form. */
  labels: FieldLabels;
  /**
   * Labels for fields nested inside an array field, keyed by the array field
   * name. Lets `colorVariants.1.colorHex` read "color 2 → Color" instead of
   * borrowing the product-level meaning of `colorHex`.
   */
  nested?: Record<string, { itemLabel: string; labels: FieldLabels }>;
}

function labelFor(
  path: readonly (string | number | symbol)[],
  { labels, nested }: InvalidDataOptions,
): string {
  if (path.length === 0) return 'Formulario';

  const [head, ...rest] = path;
  const key = String(head);
  const base = labels[key] ?? key;

  const nestedConfig = nested?.[key];
  if (nestedConfig && typeof rest[0] === 'number') {
    const childKey = rest[1] === undefined ? undefined : String(rest[1]);
    const child = childKey
      ? ` → ${nestedConfig.labels[childKey] ?? childKey}`
      : '';
    // 1-based, because that is how the editor numbers them on screen.
    return `${base} (${nestedConfig.itemLabel} ${rest[0] + 1})${child}`;
  }

  return base;
}

/**
 * A 400 that names every field that failed, e.g.
 * `"Revisa estos campos — Imágenes: Debes agregar al menos una imagen"`.
 *
 * Reads `error.issues`, not the Zod-3-era `.format()` the routes used to return:
 * that produced a nested `_errors` blob no client rendered, which is precisely
 * why the reason never reached the screen.
 */
export function invalidDataResponse(
  error: ZodError,
  options: InvalidDataOptions,
): NextResponse {
  const messages = error.issues.map(
    (issue) => `${labelFor(issue.path, options)}: ${issue.message}`,
  );
  // Deduplicated: unions and refinements both emit repeats for one field.
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

export interface WriteErrorMessages {
  /** Per unique-constraint or column name, e.g. `sku`, `Product_sku_key`. */
  unique?: Record<string, { message: string; status?: number }>;
  uniqueFallback?: string;
  /** Per foreign-key constraint or column name. */
  foreignKey?: Record<string, { message: string; status?: number }>;
  foreignKeyFallback?: string;
  /** P2025 — a related record the write needed no longer exists. */
  notFound?: string;
}

/**
 * Maps the Prisma failures an admin write can realistically hit onto a specific
 * message and an honest status. Returns `null` for anything unrecognised, so the
 * caller still logs it and answers 500 — a genuine unknown must not be dressed
 * up as a user error.
 *
 * Codes were reproduced against the real schema, not guessed:
 *   P2002 → duplicate value in a `@unique` column
 *   P2003 → foreign key pointing at a row that does not exist
 *   P2025 → a required related record missing (a `connect` target, typically)
 *
 * Note both `meta.target` and the raw meta blob are inspected: the pg driver
 * adapter reports the violated constraint inside `driverAdapterError` rather
 * than in `meta.target`, so matching only one of them misses half the cases.
 */
export function prismaWriteErrorResponse(
  err: unknown,
  messages: WriteErrorMessages,
): NextResponse | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;

  const target = err.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === 'string'
      ? [target]
      : [];
  const raw = JSON.stringify(err.meta ?? {});
  const matches = (needle: string) => fields.includes(needle) || raw.includes(needle);

  const pick = (table?: Record<string, { message: string; status?: number }>) => {
    if (!table) return null;
    for (const [needle, entry] of Object.entries(table)) {
      if (matches(needle)) return entry;
    }
    return null;
  };

  switch (err.code) {
    case 'P2002': {
      const hit = pick(messages.unique);
      if (hit) {
        return NextResponse.json({ error: hit.message }, { status: hit.status ?? 409 });
      }
      if (messages.uniqueFallback) {
        return NextResponse.json({ error: messages.uniqueFallback }, { status: 409 });
      }
      return null;
    }

    case 'P2003': {
      const hit = pick(messages.foreignKey);
      if (hit) {
        return NextResponse.json({ error: hit.message }, { status: hit.status ?? 400 });
      }
      if (messages.foreignKeyFallback) {
        return NextResponse.json({ error: messages.foreignKeyFallback }, { status: 400 });
      }
      return null;
    }

    case 'P2025':
      if (messages.notFound) {
        return NextResponse.json({ error: messages.notFound }, { status: 400 });
      }
      return null;

    default:
      return null;
  }
}

// ─── Productos ────────────────────────────────────────────────────────────────

export const PRODUCT_FIELD_LABELS: InvalidDataOptions = {
  labels: {
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
  },
  nested: {
    colorVariants: {
      itemLabel: 'color',
      labels: {
        colorName: 'Nombre del color',
        colorHex: 'Color',
        imageUrls: 'Imágenes',
        price: 'Precio',
        wholesalePrice: 'Precio mayorista',
        stock: 'Stock',
      },
    },
  },
};

export const PRODUCT_WRITE_MESSAGES: WriteErrorMessages = {
  unique: {
    sku: {
      message:
        'Ya existe otro producto con esa referencia (SKU). Cada producto necesita una referencia única — revísala o déjala vacía.',
    },
    Product_sku_key: {
      message:
        'Ya existe otro producto con esa referencia (SKU). Cada producto necesita una referencia única — revísala o déjala vacía.',
    },
    slug: { message: 'Ya existe un producto con este nombre' },
    Product_slug_key: { message: 'Ya existe un producto con este nombre' },
  },
  uniqueFallback: 'Ese valor ya está en uso por otro producto',
  foreignKeyFallback:
    'La categoría seleccionada ya no existe. Recarga la página y elige una categoría de la lista.',
  notFound:
    'Uno de los elementos seleccionados (material o etiqueta) ya no existe. Recarga la página y vuelve a elegirlos.',
};

// ─── Categorías ───────────────────────────────────────────────────────────────

export const CATEGORY_FIELD_LABELS: InvalidDataOptions = {
  labels: {
    name: 'Nombre',
    description: 'Descripción',
    imageUrl: 'Imagen',
    parentId: 'Categoría padre',
  },
};

export const CATEGORY_WRITE_MESSAGES: WriteErrorMessages = {
  unique: {
    slug: { message: 'Ya existe una categoría con este nombre' },
    Category_slug_key: { message: 'Ya existe una categoría con este nombre' },
    name: { message: 'Ya existe una categoría con este nombre' },
    Category_name_key: { message: 'Ya existe una categoría con este nombre' },
  },
  uniqueFallback: 'Ese valor ya está en uso por otra categoría',
  foreignKey: {
    Category_parentId_fkey: {
      message:
        'La categoría padre seleccionada ya no existe. Recarga la página y vuelve a elegirla.',
    },
    parentId: {
      message:
        'La categoría padre seleccionada ya no existe. Recarga la página y vuelve a elegirla.',
    },
  },
  foreignKeyFallback:
    'No se puede guardar porque algo a lo que apunta esta categoría ya no existe. Recarga la página e inténtalo de nuevo.',
  notFound:
    'La categoría padre seleccionada ya no existe. Recarga la página y vuelve a elegirla.',
};

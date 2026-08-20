/**
 * Stock RESERVATION — the atomic core that makes overselling impossible.
 *
 * ─── What changed and why ───────────────────────────────────────────────────
 *
 * Stock used to move at admin CONFIRM time. Order creation only CHECKED, by
 * reading every relevant row into a `Map` and walking the lines against it in
 * application code. That is time-of-check-to-time-of-use by construction: N
 * concurrent orders each read the same starting number, each independently
 * concluded "there is enough", and all N were accepted. Demonstrated live —
 * ten orders against a stock of ten, every one accepted, the oversell only
 * surfacing later as a "Sobrepedido" surprise on the admin's screen.
 *
 * The fix is not a better check. No amount of reading can be made safe, because
 * the value can change between the read and the write. Stock is now DECREMENTED
 * at creation by a guarded UPDATE whose WHERE clause carries the condition:
 *
 *     UPDATE "ColorVariant" SET stock = stock - $qty
 *      WHERE id = $id AND stock >= $qty
 *
 * Postgres evaluates that predicate against the row it has locked, so two
 * concurrent statements serialise: the first decrements, the second re-evaluates
 * `stock >= qty` against the ALREADY-DECREMENTED value and matches nothing,
 * reporting 0 rows affected. The check and the write are one statement, which is
 * the same reasoning `redeemCoupon` uses for coupon usage limits — the pattern
 * this deliberately mirrors.
 *
 * ─── What `stock` now MEANS ─────────────────────────────────────────────────
 *
 * A real semantic shift, worth stating plainly: `Product.stock` and
 * `ColorVariant.stock` are now UNITS AVAILABLE TO SELL, not units physically on
 * hand. A pending order holds its units. The admin therefore sees stock drop the
 * moment a customer orders, before they confirm anything — which is the point:
 * those units are genuinely no longer available to the next shopper.
 *
 * The corollary is that cancelling must give them back. See `releaseStock`, and
 * the reject handler that calls it.
 */
import { Prisma } from '@prisma/client';
import type { ColorVariant, Product } from '@prisma/client';
import { resolveLineVariant, type OrderLineColorRef } from './backorder';

/** A Prisma transaction client — anything that can run `$executeRaw`. */
export type TxClient = Pick<Prisma.TransactionClient, '$executeRaw'>;

/** Which row a line's stock lives in, and how many units it wants. */
export interface StockReservation {
  table: 'Product' | 'ColorVariant';
  rowId: string;
  quantity: number;
  /** For the error message, e.g. `Pulsera Perlas (Arena)`. */
  label: string;
}

export type ProductWithVariants = Product & { colorVariants: ColorVariant[] };

/**
 * Thrown from inside the reservation transaction so the whole thing rolls back.
 *
 * Carries the offending reservation rather than a finished message: the accurate
 * "solo N disponibles" number has to be read AFTER the rollback, because the
 * value inside the aborted transaction is not what the next shopper will see.
 */
export class InsufficientStockError extends Error {
  constructor(readonly reservation: StockReservation) {
    super(`Insufficient stock for ${reservation.label}`);
    this.name = 'InsufficientStockError';
  }
}

/** Product deleted between filling the cart and submitting it. */
export class ProductGoneError extends Error {
  constructor(readonly label: string) {
    super(`Product gone: ${label}`);
    this.name = 'ProductGoneError';
  }
}

/** `Nombre (Color)`, or just the name when the line has no colour. */
export function lineLabel(item: { name: string; color?: string | null }): string {
  return item.color ? `${item.name} (${item.color})` : item.name;
}

/**
 * Maps one order line onto the stock row it draws from.
 *
 * The primary colour's stock IS `Product.stock` — there is no ColorVariant row
 * for it — so the two cases target two different tables. `resolveLineVariant`
 * is reused rather than reimplemented so creation, reservation and release can
 * never disagree about which row a line points at.
 */
export function resolveStockRow(
  product: ProductWithVariants,
  line: OrderLineColorRef & { name: string; quantity: number; color?: string | null },
): StockReservation {
  const variant = resolveLineVariant(product, line);
  return variant
    ? { table: 'ColorVariant', rowId: variant.id, quantity: line.quantity, label: lineLabel(line) }
    : { table: 'Product', rowId: product.id, quantity: line.quantity, label: lineLabel(line) };
}

/**
 * One guarded decrement. Returns the number of rows it changed: 1 on success,
 * 0 when the row no longer holds `quantity`.
 *
 * `Product` carries `updatedAt @updatedAt`, which Prisma maintains in its own
 * client layer and therefore does NOT apply to raw SQL — so it is set here
 * explicitly. `ColorVariant` has no such column, hence the two shapes.
 */
async function decrement(tx: TxClient, res: StockReservation): Promise<number> {
  if (res.table === 'ColorVariant') {
    return tx.$executeRaw(Prisma.sql`
      UPDATE "ColorVariant"
         SET "stock" = "stock" - ${res.quantity}
       WHERE "id" = ${res.rowId}
         AND "stock" >= ${res.quantity}
    `);
  }
  return tx.$executeRaw(Prisma.sql`
    UPDATE "Product"
       SET "stock" = "stock" - ${res.quantity},
           "updatedAt" = NOW()
     WHERE "id" = ${res.rowId}
       AND "stock" >= ${res.quantity}
  `);
}

/**
 * Reserves every line, or throws so the caller's transaction rolls back.
 *
 * SEQUENTIAL on purpose, not `Promise.all`. Two lines of the same product in
 * the same colour hit the SAME row, and running them in sequence inside one
 * transaction means the second statement sees the first one's decrement — so
 * "6 + 6 of 10" fails on the second line rather than both reading 10 and both
 * succeeding. Concurrency here would reintroduce, within a single request, the
 * exact race this module exists to close.
 *
 * There is no partial outcome: the first failure throws, the caller's
 * transaction aborts, and every decrement already applied is rolled back by
 * Postgres. That is why this MUST be called inside a transaction — running it
 * against the base client would leak reservations for the lines that succeeded
 * before the one that failed.
 */
export async function reserveStock(
  tx: TxClient,
  reservations: StockReservation[],
): Promise<void> {
  for (const reservation of reservations) {
    const affected = await decrement(tx, reservation);
    if (affected !== 1) {
      throw new InsufficientStockError(reservation);
    }
  }
}

/**
 * Gives reserved units back — the exact inverse of `reserveStock`.
 *
 * Unguarded increments, deliberately: adding stock back cannot fail the way
 * taking it can, and a `WHERE` clause here would only create a way for a
 * release to silently do nothing. Being called exactly once is guaranteed by
 * the CALLER instead, which releases only in the transaction where it also won
 * the guarded `PENDING_WHATSAPP -> REJECTED` status flip. Whoever loses that
 * race never reaches this function.
 *
 * A row deleted since the order was placed simply affects 0 rows and is skipped
 * — there is nowhere to return the units to, and failing the rejection over a
 * deleted product would leave the order stuck in pending forever.
 */
export async function releaseStock(
  tx: TxClient,
  reservations: StockReservation[],
): Promise<void> {
  for (const res of reservations) {
    if (res.table === 'ColorVariant') {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "ColorVariant"
           SET "stock" = "stock" + ${res.quantity}
         WHERE "id" = ${res.rowId}
      `);
    } else {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "Product"
           SET "stock" = "stock" + ${res.quantity},
               "updatedAt" = NOW()
         WHERE "id" = ${res.rowId}
      `);
    }
  }
}

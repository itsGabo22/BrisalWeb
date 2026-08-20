-- ─────────────────────────────────────────────────────────────────────────────
-- CRITICAL: retail order PII was readable by anyone holding the anon key.
--
-- The previous policies ended in `OR "wholesaleUserId" IS NULL`. Every RETAIL
-- order has a NULL wholesaleUserId, so that branch made the whole table
-- world-readable through the Supabase data API — and the anon key is public by
-- design (it ships in the browser bundle). Confirmed against the live database:
--
--   GET /rest/v1/Order?select=id,customerName,customerPhone,total,status
--   → HTTP 200, real customer names and phone numbers.
--
-- The intent of the `IS NULL` branch was presumably "orders with no owner are
-- not private". The opposite is true: an order with no wholesale account is a
-- retail customer's order, and it carries their name and phone.
--
-- Safe to tighten: NOTHING in the application reads Order/OrderItem through
-- Supabase. Order access is entirely Prisma, which connects as the table owner
-- and bypasses RLS. The anon Supabase client is used only for Auth (sessions)
-- and Storage (buckets) — verified by grepping for `.from('Order')` and finding
-- no table reads at all.
--
-- After this, anon SELECT on both tables returns [] unless the caller is the
-- signed-in wholesaler who owns the order.
--
-- Run in the Supabase SQL editor, then re-run the verification block at the
-- bottom. RLS is already ENABLED on both tables; only the policies change.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

DROP POLICY IF EXISTS "User can read own orders" ON "Order";

CREATE POLICY "Wholesaler can read own orders"
  ON "Order" FOR SELECT
  USING (
    "wholesaleUserId" IN (
      SELECT id FROM "User" WHERE "authId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "User can read own order items" ON "OrderItem";

-- An INNER join, not the LEFT join the old policy used: a LEFT join is what
-- allowed rows whose order has no wholesaler to survive the WHERE via the
-- companion `IS NULL` test. Inner-joining makes "has an owner" a precondition.
CREATE POLICY "Wholesaler can read own order items"
  ON "OrderItem" FOR SELECT
  USING (
    "orderId" IN (
      SELECT o.id
      FROM "Order" o
      JOIN "User" u ON u.id = o."wholesaleUserId"
      WHERE u."authId" = auth.uid()::text
    )
  );

COMMIT;

-- ── Verification ─────────────────────────────────────────────────────────────
-- 1. RLS still on, and exactly one SELECT policy each with no IS NULL escape:
--
--   SELECT t.tablename, t.rowsecurity, p.policyname, p.qual
--     FROM pg_tables t
--     LEFT JOIN pg_policies p
--       ON p.tablename = t.tablename AND p.schemaname = 'public'
--    WHERE t.schemaname = 'public' AND t.tablename IN ('Order','OrderItem');
--
-- 2. No table anywhere lost RLS (must return zero rows):
--
--   SELECT tablename FROM pg_tables
--    WHERE schemaname = 'public' AND rowsecurity = false;
--
-- 3. From outside, with the anon key, both of these must now return []:
--
--   curl "$SUPABASE_URL/rest/v1/Order?select=customerName,customerPhone&limit=5" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--   curl "$SUPABASE_URL/rest/v1/OrderItem?select=name&limit=5" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
--
-- 4. The admin panel and checkout must both still work — they go through
--    Prisma, so they are unaffected, but /admin/pedidos and a test order are
--    the two things worth clicking once after running this.

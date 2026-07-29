-- Row Level Security lockdown for all public tables.
-- All application writes go through Next.js API routes using the Prisma
-- singleton on DATABASE_URL, which connects as the postgres role and
-- bypasses RLS entirely. These policies only constrain the anon/authenticated
-- roles used by supabase-js (client-side auth calls, or any direct query
-- against the exposed anon key).

-- Enable RLS on every public table
ALTER TABLE "Product"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductTag"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Discount"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImageBandeja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SiteConfig"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HeroSlide"    ENABLE ROW LEVEL SECURITY;

-- PUBLIC CATALOG: readable, nothing else
CREATE POLICY "Public can read active products"
  ON "Product" FOR SELECT USING (active = true);

CREATE POLICY "Public can read categories"
  ON "Category" FOR SELECT USING (true);

CREATE POLICY "Public can read tags"
  ON "Tag" FOR SELECT USING (true);

CREATE POLICY "Public can read product tags"
  ON "ProductTag" FOR SELECT USING (true);

CREATE POLICY "Public can read active discounts"
  ON "Discount" FOR SELECT USING (active = true);

CREATE POLICY "Public can read site config"
  ON "SiteConfig" FOR SELECT USING (id = 'singleton');

CREATE POLICY "Public can read active hero slides"
  ON "HeroSlide" FOR SELECT USING (active = true);

-- PRIVATE: User can only read their own row
CREATE POLICY "User can read own record"
  ON "User" FOR SELECT USING (auth.uid()::text = "authId");

-- PRIVATE: Order visible to its own wholesale user only
CREATE POLICY "User can read own orders"
  ON "Order" FOR SELECT USING (
    "wholesaleUserId" IN (
      SELECT id FROM "User" WHERE "authId" = auth.uid()::text
    )
    OR "wholesaleUserId" IS NULL
  );

CREATE POLICY "User can read own order items"
  ON "OrderItem" FOR SELECT USING (
    "orderId" IN (
      SELECT o.id FROM "Order" o
      LEFT JOIN "User" u ON u.id = o."wholesaleUserId"
      WHERE u."authId" = auth.uid()::text
         OR o."wholesaleUserId" IS NULL
    )
  );

-- ImageBandeja: no anon/authenticated policy at all → denied by default with RLS on

-- No INSERT/UPDATE/DELETE policies for anon or authenticated anywhere.
-- All writes go through Prisma from API routes using DATABASE_URL, which
-- connects as the postgres role and bypasses RLS entirely (RLS only
-- restricts the anon/authenticated roles used by supabase-js client calls,
-- not Prisma's direct connection).

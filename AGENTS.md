<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BRISAL by Salvador — project conventions

Non-negotiable rules for anyone working in this repo. Verified against the
codebase, not assumed.

## Stack

- **Next.js 15/16 App Router**, TypeScript **strict**.
- **Tailwind CSS v4** — tokens live in `@theme` inside `src/app/globals.css`.
  There is no `tailwind.config.*` file; do not add one.
- **Prisma 7** with the `prisma-client-js` generator. **This is locked — do
  NOT switch to the newer `prisma-client` generator.**
- **`@prisma/adapter-pg`** singleton in `src/lib/prisma.ts`.
  **NEVER call `new PrismaClient()` directly** — always
  `import { prisma } from '@/lib/prisma'`.

## CRITICAL — Blob-wrap sharp output before uploading

Node 24's undici corrupts binary bodies when a raw `Buffer` is used as a fetch
body, which is what `supabase.storage.upload()` does under the hood. Every
upload **must** wrap the buffer first:

```ts
const uploadBody = new Blob([processedBuffer], { type: 'image/webp' });
await supabase.storage.from(bucket).upload(path, uploadBody, { contentType: 'image/webp' });
```

`processAndUploadImage()` in `src/lib/supabase/storage.ts` already does this —
route new uploads through it rather than reimplementing. Skipping the wrap
produces corrupt files on Vercel.

## CRITICAL — RLS is not automatic

`prisma db push` / migrations create tables **without** row-level security, and
Supabase then flags them as a public data leak. After adding any model, run
manually:

```sql
ALTER TABLE "NewModel" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read new model" ON "NewModel" FOR SELECT USING (true);
```

Public read is correct for catalog display data; writes go through Prisma as
the table owner, which bypasses RLS. This has bitten the project more than
once — verify with `pg_class.relrowsecurity` and `pg_policies` afterwards.

Before any `db push`, preview the SQL and confirm it is additive:

```
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```

## Supabase connection

Use the **pooler** URLs (`aws-1-us-west-2.pooler.supabase.com`). The direct
`db.<ref>.supabase.co` host is IPv6-only from this environment and fails with
Prisma `P1001`.

## Design tokens

Light palette. The tokens and their hex values live in the `@theme` block of
`src/app/globals.css`, which is the single source of truth — read them there
rather than from a copy that drifts. The rules below are what the values alone
do not tell you:

- `brand-gold` is for **accents only** — hairlines, borders, small fills. It
  scores ~1.96:1 on cream, so gold **text** must use `brand-gold-deep`.
- Nothing dark is used as a **surface**. The two exceptions are the hero's
  photo overlay and the category-band scrim, both of which exist to keep text
  legible over photography.
- Fonts are addressed by **role**, never by typeface name: `font-body`,
  `font-heading`, `font-wordmark` (plus `font-sans` / `font-serif` aliases).
- **Body/nav/headings load Jost** via `next/font` (`--font-jost`), matched to
  cornalinaaccesorios.com. It is loaded as the **variable** font, so every
  weight resolves; 300/400/500 are the ones the design uses. Poppins was
  removed in Phase 8 — do not reintroduce it.
- **300 (light) is the site-wide default**, applied by `html { @apply
  font-body font-light }` in `globals.css`. Weight is something a component
  opts INTO for hierarchy, never something it has to opt out of. On a
  geometric light face, prefer **400/500 for emphasis** — `font-semibold` and
  above read blunt against a 300 base and should be reserved for the admin
  panel, where information density matters more than elegance.
- Nav links sit at **400 / 15px** with normal letter-spacing, deliberately not
  dropped to 300: they are small tap targets that have to stay crisp.
- **The "BRISAL" hero wordmark stays Playfair Display.** `--font-wordmark` is
  pinned to it so it cannot drift when the body typeface changes. Never change
  it. `HeroSection.tsx` and its overlay/shimmer are off-limits unless a task
  explicitly says otherwise.

## Data model highlights

- **Unified `User`** with `Role` enum: `CLIENTE | MAYORISTA | ADMIN`.
- **Colour model:** a product's **primary colour** lives on `Product`
  (`colorName` / `colorHex`), and the product's own `imageUrls`, `price`,
  `stock` and `sku` **are** that colour's. `ColorVariant` rows are *additional*
  colours, each with its own images and stock and an **optional** price —
  `null` means "inherit the product's price", not free. A single-colour product
  needs no variant.
  `src/lib/utils/product-options.ts` flattens primary + variants into one
  ordered list; read from it rather than re-deriving.
- **References:** products carry a client-authored SKU (`BSA-ANI-001`, …) which
  is the source of truth — **do not regenerate or overwrite existing SKUs**.
  A `BRS-…` reference is only *derived* for a product with no SKU. Colour
  references append a 3-letter code (`CLPRRJ-S` + Dorado → `CLPRRJ-S-DOR`).
  See `src/lib/utils/product-reference.ts`.
- **Pricing** is centralised in `src/lib/utils/pricing.ts`. Discounts apply
  their `percentage` to the base price; the deepest active discount wins (they
  do not stack). Promos are **not** applied on top of wholesale prices.
- **Bandeja images** are reconciled server-side in the product routes
  (`src/lib/admin/bandeja.ts`) from the saved image set — covering primary and
  variant images, and freeing rows no longer used. Don't reintroduce
  client-side assignment tracking.

## Auth

Admin is **Supabase Auth**, not a PIN. Access is gated on
`user.user_metadata.role === 'admin'`, enforced in `src/proxy.ts` for both
`/admin` and `/api/admin`.

## Platform notes

- **iOS Safari:** use `100svh`, never `100dvh` — `dvh` recomputes live as the
  address bar collapses and made the hero visibly jump mid-scroll.
- Ship `-webkit-backdrop-filter` alongside `backdrop-filter`; without the
  prefix, frosted-glass elements degrade to flat panels on iPhone.

## Definition of done

**`npm run build` must exit 0.** Also run `npx tsc --noEmit` and
`npx eslint src`. Never leave test data in the client's database — seed,
verify, then clean up.

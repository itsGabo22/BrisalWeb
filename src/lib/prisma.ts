import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Bounded on purpose. `new Pool()` with no options takes pg's default of **10**
 * clients, and on Vercel every concurrent request can be its own serverless
 * instance with its own pool — so the ceiling is 10 × instances, not 10. The
 * Supabase pooler for this project reports `max_connections = 60` with ~16 in
 * use at idle, which leaves room for roughly four concurrent instances before
 * connections start being refused. An admin page reload fires several of these
 * GETs at once (categorías, productos, site-config, and notificaciones from
 * both the sidebar and the top bar), which is exactly how a reload turned into
 * a 500.
 *
 * `connectionTimeoutMillis` matters as much as `max`: the default is 0, meaning
 * a request waits FOREVER for a free connection, so a saturated pool surfaced as
 * a hung request rather than an error anyone could see. Ten seconds fails fast
 * with a real error that the route handlers now log.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

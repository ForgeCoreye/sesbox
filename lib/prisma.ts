// Prisma client stub — database not yet configured.
// To set up: npm install @prisma/client, create prisma/schema.prisma, run npx prisma generate.

const noop = () => { throw new Error('Database not configured. Set up Prisma to enable this feature.'); };

export const prisma = new Proxy({} as any, {
  get: () => new Proxy(noop, { apply: noop, get: () => noop }),
});

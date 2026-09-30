import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

/**
 * Adapter is picked from the URL scheme so switching engines is a config
 * change, not a code change. The Prisma `datasource.provider` must be changed
 * to match (see docs/DEPLOYMENT.md) — that part is compile-time in Prisma.
 */
function makeClient() {
  if (url.startsWith("postgres")) {
    return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  }

  const client = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  // SQLite's default journal gives a writer an exclusive lock on the whole
  // file, so every read waits for it. That is survivable when the only writer
  // is a request, and not survivable while the catalogue import is running in
  // a second process for minutes at a time: the site would spend that whole
  // period returning errors. WAL lets readers carry on beside a writer, and is
  // a property of the file, so setting it once is enough. The busy timeout is
  // per connection, so both processes set it and wait for each other rather
  // than failing on contact.
  void client
    .$queryRawUnsafe("PRAGMA journal_mode=WAL")
    .then(() => client.$queryRawUnsafe("PRAGMA busy_timeout=15000"))
    .catch((e: unknown) => {
      console.warn(`[db] could not set WAL: ${e instanceof Error ? e.message : e}`);
    });

  return client;
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof makeClient> };

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

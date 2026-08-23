import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

const adapter = url.startsWith("postgres")
  ? new PrismaPg({ connectionString: url })
  : new PrismaBetterSqlite3({ url });

export const prisma = new PrismaClient({ adapter });
export type Db = typeof prisma;

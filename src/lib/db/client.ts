import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as { dbPool: Pool | undefined };

const DEFAULT_POOL_MAX = process.env.NODE_ENV === "production" ? 5 : 10;

function createPool() {
  if (globalForDb.dbPool) return globalForDb.dbPool;

  const pool = new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: getEnv().DATABASE_POOL_MAX ?? DEFAULT_POOL_MAX,
    idleTimeoutMillis: process.env.NODE_ENV === "production" ? 10_000 : 30_000,
    connectionTimeoutMillis: 5_000,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.dbPool = pool;
  }

  return pool;
}

const pool = createPool();

export const db = drizzle(pool, { schema });

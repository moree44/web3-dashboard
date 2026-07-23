import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as { dbPool: Pool | undefined };

function createPool() {
  if (globalForDb.dbPool) return globalForDb.dbPool;

  const pool = new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.dbPool = pool;
  }

  return pool;
}

const pool = createPool();

export const db = drizzle(pool, { schema });

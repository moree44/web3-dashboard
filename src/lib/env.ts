import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.coerce.number().int().min(1).max(20).optional(),
  ),
});

function parseEnv<T>(schema: z.ZodSchema<T>, values: Record<string, string | undefined>): T {
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Environment not configured. Missing or invalid: ${missing}`);
  }

  return parsed.data;
}

export function isDevelopmentPreview() {
  return (
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );
}

export function getSupabaseEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      "Supabase environment is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url: parsed.data.NEXT_PUBLIC_SUPABASE_URL, anonKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}

let _env: z.infer<typeof serverEnvSchema> | null = null;

export function getEnv() {
  if (!_env) {
    _env = parseEnv(serverEnvSchema, {
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    });
  }
  return _env;
}

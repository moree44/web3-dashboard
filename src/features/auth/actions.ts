"use server";

import { redirect } from "next/navigation";

import { loginSchema } from "@/features/auth/schemas";
import { toInternalEmail } from "@/lib/auth/username";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  error: string | null;
};

export async function login(input: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Check your username and password" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toInternalEmail(parsed.data.username),
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Invalid username or password" };
  }

  const displayName =
    typeof data.user.user_metadata.display_name === "string"
      ? data.user.user_metadata.display_name
      : parsed.data.username;
  await ensureDefaultWorkspace(data.user.id, `${displayName} Hunting OS`);

  redirect("/");
}

export async function signup(_input?: unknown): Promise<AuthActionResult> {
  void _input;
  return { error: "Signup is closed. Add users manually in Supabase." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

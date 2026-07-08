"use server";

import { redirect } from "next/navigation";

import { loginSchema, signupSchema } from "@/features/auth/schemas";
import { toInternalEmail } from "@/lib/auth/username";
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
  const { error } = await supabase.auth.signInWithPassword({
    email: toInternalEmail(parsed.data.username),
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid username or password" };
  }

  redirect("/");
}

export async function signup(input: unknown): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return { error: "Check the signup details and try again" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: toInternalEmail(parsed.data.username),
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    const duplicate = /already|registered|exists/i.test(error.message);
    return { error: duplicate ? "Username is already taken" : "Unable to create the account" };
  }

  if (!data.session) {
    return {
      error: "Signup requires email confirmation to be disabled in Supabase settings",
    };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

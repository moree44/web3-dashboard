"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { login } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await login(values);
    if (result?.error) setServerError(result.error);
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Field label="Username" error={errors.username?.message}>
        <input {...register("username")} className={inputClass} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="moree" />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input {...register("password")} className={inputClass} type="password" autoComplete="current-password" placeholder="Enter your password" />
      </Field>
      {serverError ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">{serverError}</p> : null}
      <Button className="h-10 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</Button>
      <p className="text-center text-xs text-muted-foreground">New here? <Link className="font-medium text-foreground hover:underline" href="/signup">Create an account</Link></p>
    </form>
  );
}

const inputClass = "h-10 w-full rounded-lg border border-border/25 bg-background/45 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-border/60 focus:ring-2 focus:ring-ring/25";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>{children}{error ? <span className="mt-1.5 block text-[11px] text-destructive">{error}</span> : null}</label>;
}

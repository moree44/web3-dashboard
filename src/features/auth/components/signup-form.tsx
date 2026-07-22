"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { signup } from "@/features/auth/actions";
import { signupSchema, type SignupInput } from "@/features/auth/schemas";

export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", displayName: "", password: "", passwordConfirmation: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signup(values);
    if (result?.error) setServerError(result.error);
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Field label="Username" hint="Lowercase letters, numbers, and underscores" error={errors.username?.message}>
        <input {...register("username")} className={inputClass} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="moree" />
      </Field>
      <Field label="Display name" error={errors.displayName?.message}>
        <input {...register("displayName")} className={inputClass} autoComplete="name" placeholder="Moree" />
      </Field>
      <Field label="Password" hint="At least 8 characters" error={errors.password?.message}>
        <input {...register("password")} className={inputClass} type="password" autoComplete="new-password" placeholder="Create a password" />
      </Field>
      <Field label="Confirm password" error={errors.passwordConfirmation?.message}>
        <input {...register("passwordConfirmation")} className={inputClass} type="password" autoComplete="new-password" placeholder="Repeat your password" />
      </Field>
      {serverError ? <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">{serverError}</p> : null}
      <Button className="h-10 w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</Button>
      <p className="text-center text-xs text-muted-foreground">Already have an account? <Link className="font-medium text-foreground hover:underline" href="/login">Sign in</Link></p>
    </form>
  );
}

const inputClass = "h-10 w-full rounded-lg border border-white/[0.055] bg-background/45 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25";

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium text-foreground"><span>{label}</span>{hint ? <span className="font-normal text-muted-foreground">{hint}</span> : null}</span>{children}{error ? <span className="mt-1.5 block text-[11px] text-destructive">{error}</span> : null}</label>;
}

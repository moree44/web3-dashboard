import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in · Web3 Hunting OS" };

export default function LoginPage() {
  return (
    <AuthShell eyebrow="Private workspace" title="Welcome back" description="Sign in with your username to continue hunting.">
      <LoginForm />
    </AuthShell>
  );
}

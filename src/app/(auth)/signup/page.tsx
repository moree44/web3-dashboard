import type { Metadata } from "next";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Create account · Web3 Hunting OS" };

export default function SignupPage() {
  return (
    <AuthShell eyebrow="Personal setup" title="Create your workspace login" description="Use a private username and password. No email is required.">
      <SignupForm />
    </AuthShell>
  );
}

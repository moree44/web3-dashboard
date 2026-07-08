import { AppShell } from "@/components/layout/app-shell";
import { DocsPreview } from "@/features/docs/components/docs-preview";
import { requireUser } from "@/lib/auth/session";

export default async function DocsPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!developmentPreview) await requireUser();
  return <AppShell active="Docs"><DocsPreview /></AppShell>;
}

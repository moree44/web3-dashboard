import { AppShell } from "@/components/layout/app-shell";
import { DailyPreview } from "@/features/daily/components/daily-preview";
import { requireUser } from "@/lib/auth/session";

export default async function DailyPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!developmentPreview) await requireUser();
  return <AppShell active="Daily"><DailyPreview /></AppShell>;
}

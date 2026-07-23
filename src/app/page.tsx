import { AppShell } from "@/components/layout/app-shell";
import { DashboardPreview } from "@/features/dashboard/components/dashboard-preview";
import { requireUser } from "@/lib/auth/session";

export default async function HomePage() {
  const developmentPreview =
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!developmentPreview) {
    await requireUser();
  }

  return (
    <AppShell>
      <DashboardPreview />
    </AppShell>
  );
}

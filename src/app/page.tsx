import { AppShell } from "@/components/layout/app-shell";
import { getDashboardDeadlineData } from "@/features/deadlines/actions";
import { DashboardPreview } from "@/features/dashboard/components/dashboard-preview";
import { requireUser } from "@/lib/auth/session";

export default async function HomePage() {
  const developmentPreview =
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const deadlineData = developmentPreview
    ? undefined
    : await requireUser().then(() => getDashboardDeadlineData());

  return (
    <AppShell>
      <DashboardPreview
        deadlineItems={deadlineData?.items}
        deadlineOptions={deadlineData?.options}
        deadlineDueCount={deadlineData?.dueCount}
        canManageDeadlines={!developmentPreview}
      />
    </AppShell>
  );
}

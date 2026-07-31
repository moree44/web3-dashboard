import { AppShell } from "@/components/layout/app-shell";
import { getDashboardDeadlineData } from "@/features/deadlines/actions";
import { DashboardPreview } from "@/features/dashboard/components/dashboard-preview";
import { requireUser } from "@/lib/auth/session";
import { getNftCampaignCount } from "@/features/nfts/actions";

export default async function HomePage() {
  const developmentPreview =
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  let deadlineData: Awaited<ReturnType<typeof getDashboardDeadlineData>> | undefined;
  let nftCount: number | undefined;
  if (!developmentPreview) {
    await requireUser();
    [deadlineData, nftCount] = await Promise.all([
      getDashboardDeadlineData(),
      getNftCampaignCount(),
    ]);
  }

  return (
    <AppShell>
      <DashboardPreview
        deadlineItems={deadlineData?.items}
        deadlineOptions={deadlineData?.options}
        deadlineDueCount={deadlineData?.dueCount}
        nftCount={nftCount}
        canManageDeadlines={!developmentPreview}
      />
    </AppShell>
  );
}

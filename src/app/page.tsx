import { AppShell } from "@/components/layout/app-shell";
import { getDashboardDeadlineData } from "@/features/deadlines/actions";
import { DashboardPreview } from "@/features/dashboard/components/dashboard-preview";
import { getDashboardData } from "@/features/dashboard/actions";
import { requireUser } from "@/lib/auth/session";
import { getNftCampaignCount } from "@/features/nfts/actions";
import { isDevelopmentPreview } from "@/lib/env";

export default async function HomePage() {
  const developmentPreview = isDevelopmentPreview();

  let deadlineData: Awaited<ReturnType<typeof getDashboardDeadlineData>> | undefined;
  let nftCount: number | undefined;
  let dashboardData: Awaited<ReturnType<typeof getDashboardData>> | undefined;
  if (!developmentPreview) {
    await requireUser();
    [deadlineData, nftCount, dashboardData] = await Promise.all([
      getDashboardDeadlineData(),
      getNftCampaignCount(),
      getDashboardData(),
    ]);
  }

  return (
    <AppShell>
      <DashboardPreview
        developmentPreview={developmentPreview}
        deadlineItems={deadlineData?.items}
        deadlineOptions={deadlineData?.options}
        deadlineDueCount={deadlineData?.dueCount}
        nftCount={nftCount}
        canManageDeadlines={!developmentPreview}
        dashboardData={dashboardData}
      />
    </AppShell>
  );
}

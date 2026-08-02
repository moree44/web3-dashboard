import { AppShell } from "@/components/layout/app-shell";
import { getDailyPageData } from "@/features/daily/actions";
import { DailyWorkspace } from "@/features/daily/components/daily-workspace";
import { buildDailyPageData } from "@/features/daily/daily-query";
import { taskPreviewData } from "@/features/tasks/preview-data";
import { getJakartaDateValue } from "@/features/tasks/task-duration";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const data = developmentPreview
    ? buildDailyPageData({ tasks: taskPreviewData.tasks, accounts: taskPreviewData.accounts, selectedDate: getJakartaDateValue(), logs: [], completedOnceLogKeys: new Set() })
    : await getDailyPageData();
  return <AppShell active="Daily"><DailyWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

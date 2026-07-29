import { AppShell } from "@/components/layout/app-shell";
import { getTaskWorkspaceData } from "@/features/tasks/actions";
import { TasksPreview } from "@/features/tasks/components/tasks-preview";
import { taskPreviewData } from "@/features/tasks/preview-data";

export default async function TasksPage() {
  const developmentPreview =
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const data = developmentPreview ? taskPreviewData : await getTaskWorkspaceData();

  return (
    <AppShell active="Tasks">
      <TasksPreview initialData={data} developmentPreview={developmentPreview} />
    </AppShell>
  );
}

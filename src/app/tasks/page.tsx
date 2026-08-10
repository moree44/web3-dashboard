import { AppShell } from "@/components/layout/app-shell";
import { getTaskWorkspaceData } from "@/features/tasks/actions";
import { TasksPreview } from "@/features/tasks/components/tasks-preview";
import { taskPreviewData } from "@/features/tasks/preview-data";
import { isDevelopmentPreview } from "@/lib/env";

export default async function TasksPage() {
  const developmentPreview = isDevelopmentPreview();

  const data = developmentPreview ? taskPreviewData : await getTaskWorkspaceData();

  return (
    <AppShell active="Tasks">
      <TasksPreview initialData={data} developmentPreview={developmentPreview} />
    </AppShell>
  );
}

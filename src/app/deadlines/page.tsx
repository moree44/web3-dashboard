import { AppShell } from "@/components/layout/app-shell";
import { getDeadlinePageData } from "@/features/deadlines/actions";
import { DeadlinesPreview } from "@/features/deadlines/components/deadlines-preview";
import { requireUser } from "@/lib/auth/session";
import { isDevelopmentPreview } from "@/lib/env";

export default async function DeadlinesPage() {
  const developmentPreview = isDevelopmentPreview();

  const data = developmentPreview
    ? { deadlines: [], options: { projects: [], tasks: [] } }
    : await requireUser().then(() => getDeadlinePageData());

  return (
    <AppShell active="Deadlines">
      <DeadlinesPreview
        initialDeadlines={data.deadlines}
        options={data.options}
        canPersist={!developmentPreview}
      />
    </AppShell>
  );
}

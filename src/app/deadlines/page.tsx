import { AppShell } from "@/components/layout/app-shell";
import { getDeadlinePageData } from "@/features/deadlines/actions";
import { DeadlinesPreview } from "@/features/deadlines/components/deadlines-preview";
import { requireUser } from "@/lib/auth/session";

export default async function DeadlinesPage() {
  const developmentPreview =
    process.env.NODE_ENV === "development" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

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

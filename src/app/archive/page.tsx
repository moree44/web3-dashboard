import { AppShell } from "@/components/layout/app-shell";
import { ArchivePreview } from "@/features/archive/components/archive-preview";
import { getArchivedProjects } from "@/features/projects/actions";
import { requireUser } from "@/lib/auth/session";

export default async function ArchivePage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  let initialProjects: Awaited<ReturnType<typeof getArchivedProjects>> = [];
  if (!developmentPreview) {
    await requireUser();
    initialProjects = await getArchivedProjects();
  }

  return (
    <AppShell active="Archive">
      <ArchivePreview
        initialProjects={initialProjects}
        developmentPreview={developmentPreview}
      />
    </AppShell>
  );
}

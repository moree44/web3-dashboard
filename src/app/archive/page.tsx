import { AppShell } from "@/components/layout/app-shell";
import { ArchivePreview } from "@/features/archive/components/archive-preview";
import { getArchivedProjects } from "@/features/projects/actions";
import { requireUser } from "@/lib/auth/session";
import { isDevelopmentPreview } from "@/lib/env";

export default async function ArchivePage() {
  const developmentPreview = isDevelopmentPreview();
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

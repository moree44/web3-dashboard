import { AppShell } from "@/components/layout/app-shell";
import { ProjectsPreview } from "@/features/projects/components/projects-preview";
import { getProjectsWorkspaceData } from "@/features/projects/actions";
import { projectsPreviewData } from "@/features/projects/preview-data";
import { isDevelopmentPreview } from "@/lib/env";

export default async function ProjectsPage() {
  const developmentPreview = isDevelopmentPreview();
  const data = developmentPreview ? projectsPreviewData : await getProjectsWorkspaceData();

  return (
    <AppShell active="Projects">
      <ProjectsPreview initialData={data} developmentPreview={developmentPreview} />
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { ProjectsPreview } from "@/features/projects/components/projects-preview";
import { getProjectsWorkspaceData } from "@/features/projects/actions";
import { projectsPreviewData } from "@/features/projects/preview-data";

type ProjectsPageProps = {
  searchParams?: Promise<{ view?: string | string[] }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const data = developmentPreview ? projectsPreviewData : await getProjectsWorkspaceData();

  const params = await searchParams;
  const rawView = Array.isArray(params?.view) ? params?.view[0] : params?.view;
  const view = rawView === "watchlist" ? "watchlist" : "all";

  return (
    <AppShell active={view === "watchlist" ? "Watchlist" : "Projects"}>
      <ProjectsPreview view={view} initialData={data} developmentPreview={developmentPreview} />
    </AppShell>
  );
}

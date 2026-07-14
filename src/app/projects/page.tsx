import { AppShell } from "@/components/layout/app-shell";
import { ProjectsPreview } from "@/features/projects/components/projects-preview";
import { requireUser } from "@/lib/auth/session";

type ProjectsPageProps = {
  searchParams?: Promise<{ view?: string | string[] }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!developmentPreview) await requireUser();

  const params = await searchParams;
  const rawView = Array.isArray(params?.view) ? params?.view[0] : params?.view;
  const view = rawView === "watchlist" ? "watchlist" : "all";

  return <AppShell active={view === "watchlist" ? "Watchlist" : "Projects"}><ProjectsPreview view={view} /></AppShell>;
}

import { AppShell } from "@/components/layout/app-shell";
import { getDocsPageData } from "@/features/docs/actions";
import { DocsWorkspace } from "@/features/docs/components/docs-workspace";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const data = developmentPreview ? { notes: [], projects: [] } : await getDocsPageData();
  return <AppShell active="Docs"><DocsWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

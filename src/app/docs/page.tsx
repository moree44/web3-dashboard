import { AppShell } from "@/components/layout/app-shell";
import { getDocsPageData } from "@/features/docs/actions";
import { DocsWorkspace } from "@/features/docs/components/docs-workspace";
import { isDevelopmentPreview } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const developmentPreview = isDevelopmentPreview();
  const data = developmentPreview ? { notes: [], projects: [] } : await getDocsPageData();
  return <AppShell active="Docs"><DocsWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

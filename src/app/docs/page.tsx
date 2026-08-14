import { AppShell } from "@/components/layout/app-shell";
import { getDocsPageData } from "@/features/docs/actions";
import { DocsWorkspace } from "@/features/docs/components/docs-workspace";
import { DEFAULT_NOTE_FOLDERS } from "@/features/docs/docs-types";
import { isDevelopmentPreview } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  const developmentPreview = isDevelopmentPreview();
  const data = developmentPreview
    ? {
      notes: [],
      projects: [],
      folders: DEFAULT_NOTE_FOLDERS.map((folder, index) => ({
        id: `preview-${index}`,
        name: folder.name,
        description: folder.description,
        sortOrder: index,
        createdAt: null,
        updatedAt: null,
      })),
    }
    : await getDocsPageData();
  return <AppShell active="Docs"><DocsWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

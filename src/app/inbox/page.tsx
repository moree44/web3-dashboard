import { AppShell } from "@/components/layout/app-shell";
import { getInboxPageData } from "@/features/inbox/actions";
import { InboxWorkspace } from "@/features/inbox/components/inbox-workspace";
import { requireUser } from "@/lib/auth/session";
import { isDevelopmentPreview } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const developmentPreview = isDevelopmentPreview();
  const data = developmentPreview ? { items: [], projects: [], tasks: [] } : (await requireUser(), await getInboxPageData());
  return <AppShell active="Inbox"><InboxWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

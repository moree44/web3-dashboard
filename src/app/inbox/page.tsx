import { AppShell } from "@/components/layout/app-shell";
import { getInboxPageData } from "@/features/inbox/actions";
import { InboxWorkspace } from "@/features/inbox/components/inbox-workspace";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const data = developmentPreview ? { items: [], projects: [], tasks: [] } : (await requireUser(), await getInboxPageData());
  return <AppShell active="Inbox"><InboxWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

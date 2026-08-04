import { AppShell } from "@/components/layout/app-shell";
import { SettingsWorkspace } from "@/features/settings/components/settings-workspace";
import { getSettingsData } from "@/features/settings/actions";
import { requireUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  let data;
  if (developmentPreview) {
    data = { username: "moree", displayName: "Moree", workspaceName: "Moree Hunting OS", projectCount: 0, accountCount: 0 };
  } else {
    await requireUser();
    data = await getSettingsData();
  }
  return <AppShell active="Settings"><SettingsWorkspace initialData={data} developmentPreview={developmentPreview} /></AppShell>;
}

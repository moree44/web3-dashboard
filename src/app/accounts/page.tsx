import { AppShell } from "@/components/layout/app-shell";
import { AccountsPreview } from "@/features/accounts/components/accounts-preview";
import { getAccountsWorkspaceData } from "@/features/accounts/actions";
import { accountsPreviewData } from "@/features/accounts/preview-data";

export default async function AccountsPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  const data = developmentPreview ? accountsPreviewData : await getAccountsWorkspaceData();

  return (
    <AppShell active="Accounts">
      <AccountsPreview initialData={data} developmentPreview={developmentPreview} />
    </AppShell>
  );
}

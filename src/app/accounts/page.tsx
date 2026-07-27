import { AppShell } from "@/components/layout/app-shell";
import { AccountsPreview } from "@/features/accounts/components/accounts-preview";
import { requireUser } from "@/lib/auth/session";
import {
  getAccounts,
  getWallets,
  getWalletGroups,
  type AccountWithStats,
} from "@/features/accounts/actions";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

export default async function AccountsPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  let initialAccounts: AccountWithStats[] = [];
  let initialWallets: Awaited<ReturnType<typeof getWallets>> = [];
  let initialWalletGroups: Awaited<ReturnType<typeof getWalletGroups>> = [];

  if (!developmentPreview) {
    const user = await requireUser();
    await ensureDefaultWorkspace(user.id);
    [initialAccounts, initialWallets, initialWalletGroups] = await Promise.all([
      getAccounts(),
      getWallets(),
      getWalletGroups(),
    ]);
  }

  return (
    <AppShell active="Accounts">
      <AccountsPreview
        initialAccounts={initialAccounts}
        initialWallets={initialWallets}
        initialWalletGroups={initialWalletGroups}
        developmentPreview={developmentPreview}
      />
    </AppShell>
  );
}

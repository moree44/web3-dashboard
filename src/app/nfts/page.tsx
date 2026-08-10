import { AppShell } from "@/components/layout/app-shell";
import { getNftPageData } from "@/features/nfts/actions";
import { NftsPreview } from "@/features/nfts/components/nfts-preview";
import { requireUser } from "@/lib/auth/session";
import { isDevelopmentPreview } from "@/lib/env";

export default async function NftsPage() {
  const developmentPreview = isDevelopmentPreview();
  const data = developmentPreview
    ? { campaigns: [], accounts: [], wallets: [] }
    : await requireUser().then(() => getNftPageData());

  return <AppShell active="NFTs"><NftsPreview initialCampaigns={data.campaigns} accounts={data.accounts} wallets={data.wallets} canPersist={!developmentPreview} /></AppShell>;
}

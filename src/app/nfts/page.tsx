import { AppShell } from "@/components/layout/app-shell";
import { getNftPageData } from "@/features/nfts/actions";
import { NftsPreview } from "@/features/nfts/components/nfts-preview";
import { requireUser } from "@/lib/auth/session";

export default async function NftsPage() {
  const developmentPreview = process.env.NODE_ENV === "development" && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const data = developmentPreview
    ? { campaigns: [], accounts: [], wallets: [] }
    : await requireUser().then(() => getNftPageData());

  return <AppShell active="NFTs"><NftsPreview initialCampaigns={data.campaigns} accounts={data.accounts} wallets={data.wallets} canPersist={!developmentPreview} /></AppShell>;
}

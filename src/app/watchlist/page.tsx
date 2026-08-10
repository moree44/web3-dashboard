import { AppShell } from "@/components/layout/app-shell";
import { getWatchlistPageData } from "@/features/watchlist/actions";
import { WatchlistPreview } from "@/features/watchlist/components/watchlist-preview";
import { requireUser } from "@/lib/auth/session";
import { isDevelopmentPreview } from "@/lib/env";

export default async function WatchlistPage() {
  const developmentPreview = isDevelopmentPreview();
  const data = developmentPreview
    ? { activeItems: [], convertedItems: [] }
    : await requireUser().then(() => getWatchlistPageData());

  return (
    <AppShell active="Watchlist">
      <WatchlistPreview initialData={data} canPersist={!developmentPreview} />
    </AppShell>
  );
}

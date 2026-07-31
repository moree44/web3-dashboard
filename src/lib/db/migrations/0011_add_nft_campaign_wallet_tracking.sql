-- Track the wallet used by each NFT campaign and its individual outcome.
-- Account participation remains separate so an identity can be prepared before
-- a compatible wallet has been selected.

BEGIN;

CREATE TABLE IF NOT EXISTS public.nft_campaign_wallets (
  nft_campaign_id uuid NOT NULL
    REFERENCES public.nft_campaigns(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL
    REFERENCES public.wallets(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN (
      'planned',
      'submitted',
      'whitelisted',
      'not_whitelisted',
      'minted',
      'skipped'
    )),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (nft_campaign_id, wallet_id)
);

CREATE INDEX IF NOT EXISTS nft_campaign_wallets_campaign_status_idx
  ON public.nft_campaign_wallets (nft_campaign_id, status);

CREATE INDEX IF NOT EXISTS nft_campaign_wallets_wallet_idx
  ON public.nft_campaign_wallets (wallet_id);

ALTER TABLE public.nft_campaign_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nft_campaign_wallets_workspace_access"
  ON public.nft_campaign_wallets;
CREATE POLICY "nft_campaign_wallets_workspace_access"
  ON public.nft_campaign_wallets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.nft_campaigns campaign
      WHERE campaign.id = nft_campaign_wallets.nft_campaign_id
        AND campaign.workspace_id IN (SELECT public.user_workspace_ids())
    )
    AND EXISTS (
      SELECT 1
      FROM public.wallets wallet
      WHERE wallet.id = nft_campaign_wallets.wallet_id
        AND wallet.workspace_id IN (SELECT public.user_workspace_ids())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.nft_campaigns campaign
      WHERE campaign.id = nft_campaign_wallets.nft_campaign_id
        AND campaign.workspace_id IN (SELECT public.user_workspace_ids())
    )
    AND EXISTS (
      SELECT 1
      FROM public.wallets wallet
      WHERE wallet.id = nft_campaign_wallets.wallet_id
        AND wallet.workspace_id IN (SELECT public.user_workspace_ids())
    )
  );

COMMIT;

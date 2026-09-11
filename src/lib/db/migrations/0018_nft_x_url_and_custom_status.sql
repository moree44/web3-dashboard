BEGIN;

ALTER TABLE public.nft_campaigns
  ADD COLUMN IF NOT EXISTS x_url text;

ALTER TABLE public.nft_campaigns
  DROP CONSTRAINT IF EXISTS nft_campaigns_status_check;

CREATE INDEX IF NOT EXISTS nft_campaigns_workspace_x_url_idx
  ON public.nft_campaigns (workspace_id, lower(trim(x_url)))
  WHERE x_url IS NOT NULL;

COMMIT;

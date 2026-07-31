-- Separate NFT hunting campaigns from the broader Projects workspace.
-- A campaign may have assigned Accounts and one mint schedule represented by
-- the existing Deadline model.

BEGIN;

CREATE TABLE IF NOT EXISTS public.nft_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  name text NOT NULL,
  chain text NOT NULL,
  status text NOT NULL DEFAULT 'watching'
    CHECK (status IN ('watching', 'whitelisted', 'upcoming', 'minted', 'missed')),
  mint_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS nft_campaigns_workspace_name_unique
  ON public.nft_campaigns (workspace_id, lower(trim(name)));

CREATE INDEX IF NOT EXISTS nft_campaigns_workspace_status_idx
  ON public.nft_campaigns (workspace_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.nft_campaign_accounts (
  nft_campaign_id uuid NOT NULL
    REFERENCES public.nft_campaigns(id) ON DELETE CASCADE,
  account_id uuid NOT NULL
    REFERENCES public.accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (nft_campaign_id, account_id)
);

ALTER TABLE public.deadlines
  ADD COLUMN IF NOT EXISTS linked_nft_campaign_id uuid
    REFERENCES public.nft_campaigns(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS deadlines_linked_nft_campaign_unique
  ON public.deadlines (linked_nft_campaign_id)
  WHERE linked_nft_campaign_id IS NOT NULL;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_hunt_type_without_nft_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_hunt_type_without_nft_check
  CHECK (hunt_type IS NULL OR hunt_type IN ('free_hunts', 'retro', 'waitlist'));

ALTER TABLE public.nft_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_campaign_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nft_campaigns_workspace_access" ON public.nft_campaigns;
CREATE POLICY "nft_campaigns_workspace_access" ON public.nft_campaigns
  FOR ALL TO authenticated
  USING (workspace_id IN (SELECT public.user_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.user_workspace_ids()));

DROP POLICY IF EXISTS "nft_campaign_accounts_workspace_access"
  ON public.nft_campaign_accounts;
CREATE POLICY "nft_campaign_accounts_workspace_access"
  ON public.nft_campaign_accounts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.nft_campaigns campaign
      WHERE campaign.id = nft_campaign_accounts.nft_campaign_id
        AND campaign.workspace_id IN (SELECT public.user_workspace_ids())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.nft_campaigns campaign
      WHERE campaign.id = nft_campaign_accounts.nft_campaign_id
        AND campaign.workspace_id IN (SELECT public.user_workspace_ids())
    )
  );

COMMIT;

BEGIN;

ALTER TABLE public.project_watchlist_items
  ADD COLUMN IF NOT EXISTS item_kind text NOT NULL DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS converted_nft_campaign_id uuid;

ALTER TABLE public.project_watchlist_items
  DROP CONSTRAINT IF EXISTS project_watchlist_items_converted_project_id_fkey,
  DROP CONSTRAINT IF EXISTS project_watchlist_items_converted_nft_campaign_id_fkey,
  ADD CONSTRAINT project_watchlist_items_converted_project_id_fkey
    FOREIGN KEY (converted_project_id) REFERENCES public.projects(id) ON DELETE RESTRICT,
  ADD CONSTRAINT project_watchlist_items_converted_nft_campaign_id_fkey
    FOREIGN KEY (converted_nft_campaign_id) REFERENCES public.nft_campaigns(id) ON DELETE RESTRICT;

ALTER TABLE public.project_watchlist_items
  DROP CONSTRAINT IF EXISTS project_watchlist_item_kind_check,
  DROP CONSTRAINT IF EXISTS project_watchlist_conversion_state_check;

ALTER TABLE public.project_watchlist_items
  ADD CONSTRAINT project_watchlist_item_kind_check
    CHECK (item_kind IN ('project', 'nft')),
  ADD CONSTRAINT project_watchlist_conversion_state_check CHECK (
    (
      status = 'active'
      AND converted_project_id IS NULL
      AND converted_nft_campaign_id IS NULL
    )
    OR
    (
      status = 'converted'
      AND (
        (
          item_kind = 'project'
          AND converted_project_id IS NOT NULL
          AND converted_nft_campaign_id IS NULL
        )
        OR
        (
          item_kind = 'nft'
          AND converted_project_id IS NULL
          AND converted_nft_campaign_id IS NOT NULL
        )
      )
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS project_watchlist_converted_nft_unique
  ON public.project_watchlist_items (converted_nft_campaign_id)
  WHERE converted_nft_campaign_id IS NOT NULL;

COMMIT;

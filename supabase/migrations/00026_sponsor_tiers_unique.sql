-- 重複作成防止: (event_id, type, sort_order) のユニーク制約
ALTER TABLE public.sponsor_tiers
  DROP CONSTRAINT IF EXISTS sponsor_tiers_event_type_sort_key;
ALTER TABLE public.sponsor_tiers
  ADD CONSTRAINT sponsor_tiers_event_type_sort_key UNIQUE (event_id, type, sort_order);

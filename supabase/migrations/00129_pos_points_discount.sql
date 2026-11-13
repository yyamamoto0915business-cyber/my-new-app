-- イベントポイントを「お会計の割引」に使ったときに、引いた金額を会計に残す。
-- total_yen は割引のあとに受け取ったお金。商品ごとの line_total_yen は定価のまま（割引は会計全体にかかる）。
ALTER TABLE public.pos_sales
  ADD COLUMN IF NOT EXISTS points_discount_yen INTEGER NOT NULL DEFAULT 0 CHECK (points_discount_yen >= 0);

-- 下書きのお店・キッチンカーを、公開前に見てもらうためのプレビューリンク。
-- リンクを知っている人だけが見られる（ログイン不要）。期限つき。読み書きは管理用の接続だけ。
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS preview_token TEXT,
  ADD COLUMN IF NOT EXISTS preview_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS stores_preview_token_key
  ON public.stores (preview_token) WHERE preview_token IS NOT NULL;

NOTIFY pgrst, 'reload schema';

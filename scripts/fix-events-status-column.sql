-- events.status カラム追加（本番DBで 00028 未適用時の応急対応）
-- Supabase Dashboard → SQL Editor で実行してください
-- 既にカラムがある場合はエラーになりますが、IF NOT EXISTS で安全です

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sponsor_enabled BOOLEAN NOT NULL DEFAULT true;

-- 注意:
-- ここで draft を一括で published にすると、未公開イベントまで公開される可能性があります。
-- 既存イベントの公開可否は、運用ルールに沿って個別に判断してください。
--
-- 既存イベントを「すべて公開扱い」にしたい場合のみ、下記を手動で実行:
-- UPDATE public.events
-- SET status = 'published',
--     published_at = COALESCE(published_at, created_at)
-- WHERE status = 'draft';

-- featured_collections: 特集（複数イベントをまとめたページ）
CREATE TABLE IF NOT EXISTS public.featured_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- featured_collection_items: 特集とイベントの紐付け
CREATE TABLE IF NOT EXISTS public.featured_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.featured_collections(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, event_id)
);

ALTER TABLE public.featured_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_collections_select_all" ON public.featured_collections FOR SELECT USING (true);
CREATE POLICY "featured_collection_items_select_all" ON public.featured_collection_items FOR SELECT USING (true);

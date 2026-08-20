"use client";

import {
  CalendarDays,
  Camera,
  MapPin,
  Sparkles,
  Store,
  Sun,
  Tag,
  Truck,
} from "lucide-react";
import { PostCreatePreviewCard } from "@/components/posts/PostCreatePreviewCard";
import type { PostCreateDraft } from "@/lib/posts/post-create-draft";

const TIPS = [
  {
    icon: Camera,
    title: "写真は明るく魅力的に",
    desc: "自然光で撮影した写真は、より魅力が伝わりやすくなります。",
  },
  {
    icon: Sparkles,
    title: "具体的に書くと伝わりやすい",
    desc: "どんな体験ができたか、感じたことを具体的に書くと◎",
  },
  {
    icon: Tag,
    title: "タグを活用しよう",
    desc: "関連するタグを付けると、同じ興味の人に見つけてもらえます。",
  },
  {
    icon: MapPin,
    title: "位置情報で見つけやすく",
    desc: "位置情報を追加すると、近くの人に届きやすくなります。",
  },
] as const;

const CATEGORY_EXAMPLES = [
  {
    icon: CalendarDays,
    label: "イベント",
    desc: "マルシェ、祭り、ワークショップなど",
  },
  {
    icon: Store,
    label: "お店",
    desc: "カフェ、レストラン、雑貨店など",
  },
  {
    icon: MapPin,
    label: "スポット",
    desc: "公園、展望台、フォトスポットなど",
  },
  {
    icon: Truck,
    label: "キッチンカー",
    desc: "出店情報、メニューのおすすめなど",
  },
  {
    icon: Sun,
    label: "風景・日常",
    desc: "街並み、季節の風景、日常のひとコマ",
  },
] as const;

type Props = {
  draft: PostCreateDraft;
};

export function PostCreateSidebar({ draft }: Props) {
  return (
    <aside className="posts-create-sidebar" aria-label="投稿のヒントとプレビュー">
      <section className="posts-side-panel">
        <h2 className="posts-side-panel__title">投稿プレビュー</h2>
        <div className="mt-3">
          <PostCreatePreviewCard draft={draft} />
        </div>
      </section>

      <section className="posts-side-panel">
        <h2 className="posts-side-panel__title">投稿のコツ</h2>
        <ul className="posts-create-tips mt-3">
          {TIPS.map((tip) => (
            <li key={tip.title} className="posts-create-tip">
              <span className="posts-create-tip__icon" aria-hidden>
                <tip.icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="posts-create-tip__title">{tip.title}</p>
                <p className="posts-create-tip__desc">{tip.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="posts-side-panel">
        <h2 className="posts-side-panel__title">カテゴリーの例</h2>
        <ul className="posts-create-categories mt-3">
          {CATEGORY_EXAMPLES.map((item) => (
            <li key={item.label} className="posts-create-category">
              <span className="posts-create-category__icon" aria-hidden>
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="posts-create-category__label">{item.label}</p>
                <p className="posts-create-category__desc">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

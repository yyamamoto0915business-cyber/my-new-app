"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Store } from "lucide-react";
import { MobileSectionHeading } from "@/components/home/mobile/MobileSectionHeading";
import type { StoreRecord } from "@/lib/stores/types";

/** 掲載からこの日数までは NEW を付ける */
const NEW_DAYS = 30;

type Props = {
  stores: StoreRecord[];
  loading: boolean;
};

function openedAt(s: StoreRecord): string {
  return s.publishedAt || s.createdAt;
}

/** まちの情報（スマホ）：新しくできたお店。いちばん新しいお店を横長のカードで出す */
export function MobileNewStores({ stores, loading }: Props) {
  // NEW の判定に使う今の時刻（描画のたびに変わらないよう最初に一度だけ取る）
  const [now] = useState(() => Date.now());
  const store = useMemo(() => {
    const list = stores
      .filter((s) => s.kind === "store")
      .sort((a, b) => openedAt(b).localeCompare(openedAt(a)));
    return list[0] ?? null;
  }, [stores]);

  // データがないあいだはセクションごと出さない（読み込み中も場所を取らない）
  if (loading || !store) return null;

  const isNew = now - new Date(openedAt(store)).getTime() < NEW_DAYS * 24 * 60 * 60 * 1000;
  const image = store.coverImageUrl || store.galleryImages[0] || null;
  const text = store.tagline || store.description || store.category || "";

  return (
    <section aria-label="新しくできたお店">
      <MobileSectionHeading eyebrow="NEW OPEN" title="新しくできたお店" href="/?kind=store" />

      <Link
        href={`/stores/${store.id}`}
        className="flex items-stretch overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white shadow-[0_3px_10px_rgba(22,56,40,0.06)] active:bg-[#fafcf9]"
      >
        <div className="relative w-[44%] shrink-0 bg-[#e8ede4]">
          {image ? (
            <Image src={image} alt="" fill sizes="44vw" className="object-cover" />
          ) : (
            <div className="flex h-full min-h-[104px] items-center justify-center text-[#8aa595]">
              <Store className="h-8 w-8" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1 py-3 pl-3 pr-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-[15px] font-bold leading-snug text-[#163828]">
                {store.name}
              </p>
              {isNew && (
                <span className="shrink-0 rounded-full bg-[#4f7d3a] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                  NEW
                </span>
              )}
            </div>
            {text && (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#4f5d54]">{text}</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#1f5e3a]" aria-hidden />
        </div>
      </Link>
    </section>
  );
}

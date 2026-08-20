"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { EventGalleryImagesInput } from "@/components/organizer/events/EventGalleryImagesInput";
import { DetailImageSwitcher } from "@/components/media/DetailImageSwitcher";
import { EventDetailFlyerImage } from "@/components/events/EventDetailFlyerImage";
import { EventThumbnail } from "@/components/event-thumbnail";

const SAMPLE = [
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
];

type Tab = "create" | "detail" | "list";

export function GalleryImagesPreviewClient() {
  const searchParams = useSearchParams();
  const mobile = searchParams.get("view") === "mobile";
  const [tab, setTab] = useState<Tab>("create");
  const [imageUrl, setImageUrl] = useState(SAMPLE[0]);
  const [galleryImages, setGalleryImages] = useState(SAMPLE.slice(1, 4));

  const frameClass = useMemo(
    () =>
      mobile
        ? "mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e0ddd6] bg-[#f7f6f2] shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        : "mx-auto w-full max-w-[920px] overflow-hidden rounded-[16px] border border-[#e0ddd6] bg-[#f7f6f2]",
    [mobile]
  );

  return (
    <div className="min-h-screen bg-[#f3f1ec] px-4 py-6 text-[#1a1a1a]">
      <div className="mx-auto mb-5 max-w-[920px]">
        <p className="mb-1 text-[12px] font-medium text-[#8a8680]">プレビュー（ログイン不要）</p>
        <h1 className="text-[22px] font-bold tracking-tight">複数画像対応</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-[#5c5a54]">
          作成で複数枚を設定 → 詳細で切り替え → 一覧は代表1枚。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["create", "作成画面"],
              ["detail", "詳細画面"],
              ["list", "一覧（1枚）"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                tab === id
                  ? "bg-[#2B3A6B] text-white"
                  : "border border-[#d8d4cc] bg-white text-[#4a4844]"
              }`}
            >
              {label}
            </button>
          ))}
          <Link
            href={mobile ? "/gallery-images-preview" : "/gallery-images-preview?view=mobile"}
            className="rounded-full border border-[#d8d4cc] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#4a4844]"
          >
            {mobile ? "PC幅で見る" : "モバイル幅で見る"}
          </Link>
        </div>
      </div>

      <div className={frameClass}>
        {tab === "create" ? (
          <div className="space-y-3 p-4 min-[900px]:p-6">
            <div>
              <p className="mb-2 text-[13px] font-semibold text-[#4a4844]">
                アイキャッチ画像 <span className="text-[11px] font-normal text-[#8a8680]">任意</span>
              </p>
              <div className="space-y-2 rounded-[10px] border border-[#ebe8e2] bg-[#fafaf8] p-2">
                <EventImageInput
                  url={imageUrl}
                  onChangeUrl={setImageUrl}
                  alt="プレビュー"
                  compact
                  bare
                  hint="一覧は代表画像のみ"
                />
                <div className="border-t border-[#ebe8e2] pt-2">
                  <EventGalleryImagesInput
                    urls={galleryImages}
                    onChange={setGalleryImages}
                    compact
                  />
                </div>
              </div>
            </div>
            <p className="rounded-[10px] bg-white/80 px-3 py-2 text-[12px] text-[#5c5a54]">
              ※ このプレビューではアップロードせず、上のサンプル画像で見た目を確認できます。
              実画面は `/organizer/events/new` と `/organizer/recruitments/new` です。
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-[9px] bg-[#2B3A6B] px-3 py-2 text-[12px] font-medium text-white"
                onClick={() => {
                  setImageUrl(SAMPLE[0]);
                  setGalleryImages(SAMPLE.slice(1, 4));
                }}
              >
                サンプルを入れる
              </button>
              <button
                type="button"
                className="rounded-[9px] border border-[#d0ccc4] bg-white px-3 py-2 text-[12px] font-medium"
                onClick={() => {
                  setImageUrl("");
                  setGalleryImages([]);
                }}
              >
                クリア
              </button>
            </div>
          </div>
        ) : null}

        {tab === "detail" ? (
          <div className="p-4 min-[900px]:p-6">
            <p className="mb-3 text-[12px] font-medium text-[#8a8680]">
              詳細ヒーロー（サムネをタップで切り替え）
            </p>
            <DetailImageSwitcher
              coverUrl={imageUrl || SAMPLE[0]}
              galleryImages={galleryImages}
              alt="春の地域マルシェ"
              renderMain={(activeUrl) => (
                <EventDetailFlyerImage
                  imageUrl={activeUrl}
                  alt="春の地域マルシェ"
                  variant={mobile ? "mobileHero" : "cardTop"}
                  className={mobile ? "h-[210px]" : undefined}
                />
              )}
            />
            <div className="mt-4">
              <p className="mb-1 text-[11px] font-medium text-[#8a8680]">公開中</p>
              <h2 className="text-[20px] font-bold tracking-tight">春の地域マルシェ</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#5c5a54]">
                地域の魅力が伝わる写真を、詳細では複数枚切り替えできます。
              </p>
            </div>
          </div>
        ) : null}

        {tab === "list" ? (
          <div className="p-4 min-[900px]:p-6">
            <p className="mb-3 text-[12px] font-medium text-[#8a8680]">
              検索・一覧カード（代表画像のみ）
            </p>
            <div className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-white">
              <EventThumbnail
                imageUrl={imageUrl || SAMPLE[0]}
                alt="春の地域マルシェ"
                rounded="none"
                className="!aspect-video"
              />
              <div className="p-3.5">
                <p className="text-[11px] font-medium text-[#8a8680]">3月15日（日）10:00〜</p>
                <h2 className="mt-0.5 text-[16px] font-bold">春の地域マルシェ</h2>
                <p className="mt-1 text-[12px] text-[#5c5a54]">中央公園 / 無料</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-[#8a8680]">
              ギャラリー画像は一覧には出ません。
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

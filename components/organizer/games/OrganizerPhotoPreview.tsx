"use client";

import Image from "next/image";
import { Calendar, Camera, Gift, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhotoSpot } from "@/lib/organizer/photo";

type PreviewTab = "cover" | "spots" | "rewards";

type Props = {
  name: string;
  description: string;
  periodLabel: string | null;
  category: string;
  tags: string[];
  coverImage: string;
  themeColor: string;
  spots: PhotoSpot[];
  clearCount: number;
  photoRequired: boolean;
  points: number;
  rewards: { points: boolean; coupon: boolean; prize: boolean };
  tab: PreviewTab;
  onTab: (tab: PreviewTab) => void;
};

export function OrganizerPhotoPreview({
  name,
  description,
  periodLabel,
  category,
  tags,
  coverImage,
  themeColor,
  spots,
  clearCount,
  photoRequired,
  points,
  rewards,
  tab,
  onTab,
}: Props) {
  const title = name.trim() || "フォトラリー";
  const lead = description.trim() || "スポットを巡って写真を撮りながら、地域の魅力を見つけよう！";
  const shownTags = tags.slice(0, 4);

  return (
    <aside className="org-photo__preview">
      <div className="org-photo__preview-head">
        <div className="org-photo__preview-tabs" role="tablist" aria-label="プレビュー切替">
          <button type="button" className={cn(tab === "cover" && "is-on")} onClick={() => onTab("cover")}>
            プレビュー
          </button>
          <button type="button" className={cn(tab === "spots" && "is-on")} onClick={() => onTab("spots")}>
            スポット一覧（{spots.length}）
          </button>
          <button type="button" className={cn(tab === "rewards" && "is-on")} onClick={() => onTab("rewards")}>
            報酬・特典
          </button>
        </div>
      </div>
      <div className="org-photo__phone">
        <div className="org-photo__phone-bar" aria-hidden>
          <span>9:41</span>
        </div>
        {tab === "cover" ? (
          <div className="org-photo__screen">
            <div className="org-photo__screen-hero">
              {coverImage ? (
                <Image src={coverImage} alt="" width={640} height={400} unoptimized />
              ) : (
                <span />
              )}
              <em>開催前</em>
            </div>
            <div className="org-photo__screen-body">
              <h3>{title}</h3>
              <p>{lead}</p>
              {periodLabel ? (
                <small>
                  <Calendar className="h-3 w-3" aria-hidden />
                  {periodLabel}
                </small>
              ) : null}
              <div className="org-photo__screen-tags">
                {category ? <span>{category}</span> : null}
                {shownTags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <strong>このゲームについて</strong>
              <p>{lead}</p>
              <b style={{ background: themeColor }}>参加する（無料）</b>
            </div>
          </div>
        ) : null}
        {tab === "spots" ? (
          <div className="org-photo__screen is-list">
            <h3>撮影スポット</h3>
            {spots.length === 0 ? (
              <p className="org-photo__screen-empty">スポットを追加すると、ここに並びます。</p>
            ) : (
              <ul>
                {spots.slice(0, 5).map((spot, index) => (
                  <li key={spot.key}>
                    <em>{index + 1}</em>
                    <div>
                      <strong>{spot.name.trim() || "撮影スポット"}</strong>
                      <span>
                        <MapPin className="h-3 w-3" aria-hidden />
                        {spot.place.trim() || "場所未設定"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
        {tab === "rewards" ? (
          <div className="org-photo__screen is-list">
            <h3>クリア特典</h3>
            <p>
              {clearCount}スポット達成でクリア
              {photoRequired ? "（写真投稿が必要）" : ""}
            </p>
            <ul className="org-photo__reward-list">
              {rewards.points ? (
                <li>
                  <Gift className="h-4 w-4" aria-hidden />
                  ポイント {points}pt
                </li>
              ) : null}
              {rewards.coupon ? (
                <li>
                  <Gift className="h-4 w-4" aria-hidden />
                  クーポン
                </li>
              ) : null}
              {rewards.prize ? (
                <li>
                  <Camera className="h-4 w-4" aria-hidden />
                  景品・記念品
                </li>
              ) : null}
              {!rewards.points && !rewards.coupon && !rewards.prize ? (
                <li>特典はまだ選んでいません</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
      <p className="org-photo__preview-note">
        実際の参加画面をプレビューできます。スポットやルールを設定すると、よりリアルに表示されます。
      </p>
    </aside>
  );
}

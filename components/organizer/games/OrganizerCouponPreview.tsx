"use client";

import Image from "next/image";
import { Calendar, Gift, MapPin, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { couponWinLabel, type CouponStore, type CouponWinMode } from "@/lib/organizer/coupon";

type PreviewTab = "cover" | "stores" | "rules";

type Props = {
  name: string;
  description: string;
  periodLabel: string | null;
  category: string;
  tags: string[];
  coverImage: string;
  stores: CouponStore[];
  winMode: CouponWinMode;
  winCount: number;
  oncePerPerson: boolean;
  noStack: boolean;
  useStart: string;
  useEnd: string;
  tab: PreviewTab;
  onTab: (tab: PreviewTab) => void;
};

export function OrganizerCouponPreview({
  name,
  description,
  periodLabel,
  category,
  tags,
  coverImage,
  stores,
  winMode,
  winCount,
  oncePerPerson,
  noStack,
  useStart,
  useEnd,
  tab,
  onTab,
}: Props) {
  const title = name.trim() || "クーポンラリー";
  const lead = description.trim() || "お店をめぐってクーポンを集め、まちの魅力をもっと楽しもう！";
  const shown = stores.filter((store) => store.name.trim()).slice(0, 4);
  const win = couponWinLabel(winMode, winCount, shown.length || stores.length);

  return (
    <aside className="org-coupon__preview">
      <div className="org-coupon__preview-head">
        <p>参加者プレビュー</p>
        <div className="org-coupon__preview-tabs" role="tablist" aria-label="プレビュー切替">
          <button type="button" className={cn(tab === "cover" && "is-on")} onClick={() => onTab("cover")}>
            カバー
          </button>
          <button type="button" className={cn(tab === "stores" && "is-on")} onClick={() => onTab("stores")}>
            店舗（{shown.length}）
          </button>
          <button type="button" className={cn(tab === "rules" && "is-on")} onClick={() => onTab("rules")}>
            条件
          </button>
        </div>
      </div>
      <div className="org-coupon__phone">
        <div className="org-coupon__phone-bar" aria-hidden>
          <span>9:41</span>
        </div>
        {tab === "cover" ? (
          <div className="org-coupon__screen">
            <div className="org-coupon__screen-hero">
              {coverImage ? <Image src={coverImage} alt="" width={640} height={400} unoptimized /> : <span />}
              <em>開催前</em>
            </div>
            <div className="org-coupon__screen-body">
              <h3>{title}</h3>
              <p>{lead}</p>
              {periodLabel ? (
                <small>
                  <Calendar className="h-3 w-3" aria-hidden />
                  {periodLabel}
                </small>
              ) : null}
              <div className="org-coupon__screen-tags">
                {category ? <span>{category}</span> : null}
                {tags.slice(0, 3).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <b>クーポンラリーに参加する</b>
              <strong>このクーポンラリーの楽しみ方</strong>
              <ol>
                <li>
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  お店をめぐる
                </li>
                <li>
                  <Ticket className="h-3.5 w-3.5" aria-hidden />
                  クーポンを集める
                </li>
                <li>
                  <Gift className="h-3.5 w-3.5" aria-hidden />
                  お得に楽しむ
                </li>
              </ol>
            </div>
          </div>
        ) : null}
        {tab === "stores" ? (
          <div className="org-coupon__screen is-list">
            <h3>参加店舗</h3>
            {shown.length === 0 ? (
              <p className="org-coupon__screen-empty">店舗を追加すると、ここに並びます。</p>
            ) : (
              <ul>
                {shown.map((store) => (
                  <li key={store.key}>
                    <Image src={store.imageUrl} alt="" width={56} height={56} unoptimized />
                    <div>
                      <strong>{store.name}</strong>
                      <span>
                        {store.category} ・ {store.offer.trim() || "クーポン未設定"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <b>クーポンラリーに参加する</b>
          </div>
        ) : null}
        {tab === "rules" ? (
          <div className="org-coupon__screen is-list">
            <h3>クーポンを集めてまちをもっとおトクに</h3>
            <p>{win}</p>
            <strong>利用条件</strong>
            <ul className="org-coupon__rule-list">
              <li>{oncePerPerson ? "1人1回まで利用可能" : "回数制限なし"}</li>
              <li>{noStack ? "他のクーポンと併用不可" : "他のクーポンと併用できる"}</li>
              {useStart && useEnd ? (
                <li>
                  利用期間 {useStart.replaceAll("-", "/")} 〜 {useEnd.replaceAll("-", "/")}
                </li>
              ) : null}
            </ul>
            {shown[0] ? (
              <p className="org-coupon__screen-empty">
                獲得できるクーポン例：{shown[0].name} / {shown[0].offer}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="org-coupon__preview-note">実際の参加画面のイメージです。店舗や条件を決めると、表示が変わります。</p>
    </aside>
  );
}

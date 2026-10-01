"use client";

import Image from "next/image";
import { Check, Gift, MapPin, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkinClearLabel, type CheckinClearMode, type CheckinSpot } from "@/lib/organizer/checkin";

type PreviewTab = "cover" | "spots" | "rewards";

type Props = {
  name: string;
  description: string;
  coverImage: string;
  spots: CheckinSpot[];
  clearMode: CheckinClearMode;
  clearCount: number;
  couponOn: boolean;
  couponName: string;
  couponDetail: string;
  pointsOn: boolean;
  points: number;
  stampOn: boolean;
  rankingOn: boolean;
  tab: PreviewTab;
  onTab: (tab: PreviewTab) => void;
};

export function OrganizerCheckinPreview({
  name,
  description,
  coverImage,
  spots,
  clearMode,
  clearCount,
  couponOn,
  couponName,
  couponDetail,
  pointsOn,
  points,
  stampOn,
  rankingOn,
  tab,
  onTab,
}: Props) {
  const title = name.trim() || "チェックイン";
  const lead = description.trim() || "まちをめぐって、素敵な特典を見つけよう！";
  const named = spots.filter((spot) => spot.name.trim());
  const shown = named.slice(0, 5);
  const doneCount = Math.min(2, shown.length);
  const clear = checkinClearLabel(clearMode, clearCount, named.length);

  return (
    <aside className="org-checkin__preview">
      <div className="org-checkin__preview-head">
        <p>参加者画面プレビュー</p>
        <span>実際の表示は参加の画面イメージです。</span>
        <div className="org-checkin__preview-tabs" role="tablist" aria-label="プレビュー切替">
          <button type="button" className={cn(tab === "cover" && "is-on")} onClick={() => onTab("cover")}>
            カバー
          </button>
          <button type="button" className={cn(tab === "spots" && "is-on")} onClick={() => onTab("spots")}>
            スポット
          </button>
          <button type="button" className={cn(tab === "rewards" && "is-on")} onClick={() => onTab("rewards")}>
            特典
          </button>
        </div>
      </div>
      <div className="org-checkin__phone">
        <div className="org-checkin__phone-bar" aria-hidden>
          <span>9:41</span>
          <strong>{title}</strong>
          <span />
        </div>
        {tab === "cover" || tab === "spots" ? (
          <div className="org-checkin__screen">
            <div className="org-checkin__screen-hero">
              {coverImage ? <Image src={coverImage} alt="" width={640} height={360} unoptimized /> : <span />}
              <Image
                className="org-checkin__screen-mascot"
                src="/organizer/games/game-type-checkin.png"
                alt=""
                width={88}
                height={88}
                unoptimized
              />
              <div>
                <h3>{title}</h3>
                <p>{lead}</p>
              </div>
            </div>
            <div className="org-checkin__screen-body">
              <div className="org-checkin__progress">
                <span>達成状況</span>
                <strong>
                  {doneCount} / {Math.max(shown.length, 1)} スポット
                </strong>
                <b style={{ width: `${Math.round((doneCount / Math.max(shown.length, 1)) * 100)}%` }} />
              </div>
              <div className="org-checkin__screen-switch">
                <em className="is-on">スポット一覧</em>
                <em>マップで見る</em>
              </div>
              {shown.length === 0 ? (
                <p className="org-checkin__screen-empty">スポットを追加すると、ここに並びます。</p>
              ) : (
                <ul className="org-checkin__spot-list">
                  {shown.map((spot, index) => (
                    <li key={spot.key}>
                      <Image src={spot.imageUrl} alt="" width={52} height={52} unoptimized />
                      <div>
                        <strong>{spot.name}</strong>
                        <span>{index < doneCount ? "チェックイン済み" : "未達成"}</span>
                      </div>
                      {index < doneCount ? <Check className="h-4 w-4" aria-hidden /> : <MapPin className="h-4 w-4" aria-hidden />}
                    </li>
                  ))}
                </ul>
              )}
              <b className="org-checkin__screen-cta">チェックインする</b>
            </div>
          </div>
        ) : (
          <div className="org-checkin__screen">
            <div className="org-checkin__screen-hero is-reward">
              <Image
                className="org-checkin__screen-mascot"
                src="/organizer/games/game-type-checkin.png"
                alt=""
                width={88}
                height={88}
                unoptimized
              />
              <div>
                <h3>まちをめぐって特典をもらおう！</h3>
                <p>すべてのスポットをまわって、素敵な特典をゲットしよう</p>
              </div>
            </div>
            <div className="org-checkin__screen-body">
              <div className="org-checkin__progress">
                <span>達成状況</span>
                <strong>
                  {Math.min(3, shown.length)} / {Math.max(shown.length, 1)} スポット
                </strong>
                <b style={{ width: `${Math.round((Math.min(3, shown.length) / Math.max(shown.length, 1)) * 100)}%` }} />
              </div>
              <p className="org-checkin__gift-head">
                <Gift className="h-3.5 w-3.5" aria-hidden />
                条件達成で特典をプレゼント！
              </p>
              {couponOn ? (
                <div className="org-checkin__coupon-card">
                  <Ticket className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>{couponName.trim() || "まち歩き応援クーポン"}</strong>
                    <span>{couponDetail.trim() || "対象店舗で使えるクーポン"}</span>
                  </div>
                </div>
              ) : null}
              <strong className="org-checkin__reward-title">達成特典</strong>
              <ul className="org-checkin__reward-list">
                {couponOn ? <li>{couponName.trim() || "まち歩き応援クーポン"}</li> : null}
                {pointsOn ? <li>{points}ポイント</li> : null}
                {stampOn ? <li>デジタルスタンプ</li> : null}
                {!couponOn && !pointsOn && !stampOn ? <li>特典はまだ設定されていません</li> : null}
              </ul>
              <p className="org-checkin__screen-empty">{clear}</p>
              {rankingOn ? <p className="org-checkin__screen-empty">ランキング表示あり</p> : null}
              <b className="org-checkin__screen-cta is-ghost">ヒントをみる</b>
            </div>
          </div>
        )}
      </div>
      <p className="org-checkin__preview-note">スポットや特典を決めると、表示が変わります。</p>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { CalendarDays, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatScheduleLocationOnly,
  formatScheduleTimeRange,
  listUpcomingSchedules,
  scheduleDateShortLabel,
  scheduleStatusLabel,
} from "@/lib/stores/schedule-view";
import type {
  StoreIntroUpdateInput,
  StoreRecord,
  StoreScheduleRecord,
} from "@/lib/stores/types";

const KITCHEN_PREVIEW_LIMIT = 3;

type Props = {
  store: StoreRecord;
  onSaved: (store: StoreRecord) => void;
  schedules?: StoreScheduleRecord[];
  onGoToSchedule?: () => void;
};

export function StoreAccessEditForm({
  store,
  onSaved,
  schedules = [],
  onGoToSchedule,
}: Props) {
  const isKitchen = store.kind === "kitchen_car";
  const [hoursLabel, setHoursLabel] = useState(store.hoursLabel ?? "");
  const [address, setAddress] = useState(store.address ?? "");
  const [accessNote, setAccessNote] = useState(store.accessNote ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [seatsInfo, setSeatsInfo] = useState(store.seatsInfo ?? "");
  const [paymentMethods, setPaymentMethods] = useState(store.paymentMethods ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(store.websiteUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const upcomingAll = isKitchen
    ? listUpcomingSchedules(schedules, { includeCancelled: true })
    : [];
  const upcoming = upcomingAll.slice(0, KITCHEN_PREVIEW_LIMIT);
  const moreCount = Math.max(0, upcomingAll.length - upcoming.length);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedFlash(false);

    const body: StoreIntroUpdateInput = {
      hoursLabel: hoursLabel.trim() || null,
      ...(isKitchen
        ? {}
        : { address: address.trim() || null }),
      // キッチンカーの出店場所はスケジュールが正。説明文は任意の補足のみ残す
      accessNote: isKitchen ? null : accessNote.trim() || null,
      phone: phone.trim() || null,
      seatsInfo: isKitchen ? null : seatsInfo.trim() || null,
      paymentMethods: paymentMethods.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
    };

    try {
      const res = await fetch(`/api/organizer/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました");
        return;
      }
      onSaved(json as StoreRecord);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2200);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="org-store-intro" onSubmit={(e) => void handleSubmit(e)}>
      {isKitchen ? (
        <div className="org-store-access-schedule org-store-access-schedule--compact">
          <div className="org-store-access-schedule__head">
            <h3 className="org-store-access-schedule__title">
              <MapPin className="size-4" strokeWidth={2.2} aria-hidden />
              出店場所（スケジュール連動）
            </h3>
            {onGoToSchedule ? (
              <button
                type="button"
                className="org-store-access-schedule__link"
                onClick={onGoToSchedule}
              >
                <CalendarDays className="size-3.5" strokeWidth={2.2} aria-hidden />
                出店スケジュールを編集
              </button>
            ) : null}
          </div>
          <p className="org-store-access-schedule__hint">
            公開ページには出店スケジュールが自動反映されます。
          </p>
          {upcoming.length > 0 ? (
            <>
              <ul className="org-store-access-schedule__compact-list">
                {upcoming.map((s) => {
                  const time = formatScheduleTimeRange(s.startTime, s.endTime);
                  return (
                    <li key={s.id} className="org-store-access-schedule__compact-row">
                      <span className="org-store-access-schedule__compact-date">
                        {scheduleDateShortLabel(s.eventDate)}
                      </span>
                      <span className="org-store-access-schedule__compact-body">
                        <span className="org-store-access-schedule__compact-place">
                          {formatScheduleLocationOnly(s)}
                        </span>
                        <span className="org-store-access-schedule__compact-meta">
                          {s.eventName}
                          {time ? `・${time}` : ""}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "org-store-access-schedule__badge",
                          s.status === "scheduled" && "is-scheduled",
                          s.status === "adjusting" && "is-adjusting",
                          s.status === "cancelled" && "is-cancelled",
                        )}
                      >
                        {scheduleStatusLabel(s.status)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {moreCount > 0 && onGoToSchedule ? (
                <button
                  type="button"
                  className="org-store-access-schedule__more"
                  onClick={onGoToSchedule}
                >
                  ほか {moreCount} 件を出店スケジュールで見る
                </button>
              ) : null}
            </>
          ) : (
            <p className="org-store-access-schedule__empty">
              まだ今後の出店予定がありません。「出店スケジュール」から登録してください。
            </p>
          )}
        </div>
      ) : null}

      <div className="org-store-intro__grid">
        <label className="org-store-intro__field">
          <span>{isKitchen ? "標準の営業時間" : "営業時間"}</span>
          <input
            type="text"
            value={hoursLabel}
            onChange={(e) => setHoursLabel(e.target.value)}
            placeholder="例: 平日 10:00～18:00 / 土日 9:00～19:00"
            maxLength={80}
          />
        </label>

        <label className="org-store-intro__field">
          <span>電話番号</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="例: 03-1234-5678"
            maxLength={30}
          />
        </label>

        {!isKitchen ? (
          <label className="org-store-intro__field org-store-intro__field--full">
            <span>住所</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例: 東京都練馬区練馬1-2-3"
              maxLength={200}
            />
          </label>
        ) : null}

        {!isKitchen ? (
          <label className="org-store-intro__field org-store-intro__field--full">
            <span>アクセス説明</span>
            <textarea
              value={accessNote}
              onChange={(e) => setAccessNote(e.target.value)}
              rows={3}
              placeholder="例: 練馬駅北口から徒歩3分。駐車場は近隣コインパーキングをご利用ください。"
              maxLength={500}
            />
          </label>
        ) : null}

        {!isKitchen ? (
          <label className="org-store-intro__field">
            <span>席数</span>
            <input
              type="text"
              value={seatsInfo}
              onChange={(e) => setSeatsInfo(e.target.value)}
              placeholder="例: 28席（テラス8席）"
              maxLength={80}
            />
          </label>
        ) : null}

        <label className="org-store-intro__field">
          <span>支払い方法</span>
          <input
            type="text"
            value={paymentMethods}
            onChange={(e) => setPaymentMethods(e.target.value)}
            placeholder="例: 現金・クレジット・PayPay"
            maxLength={120}
          />
        </label>

        <label className="org-store-intro__field">
          <span>公式サイト URL</span>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <p className="org-store-access__hint">
        {isKitchen
          ? "出店場所はスケジュールから自動反映されます。ここでは連絡先や支払い方法を登録します。"
          : "住所を保存すると、公開ページの地図・ルートマップに反映されます。"}
      </p>

      {error ? <p className="org-store-intro__error">{error}</p> : null}
      {savedFlash ? (
        <p className="org-store-intro__ok" role="status">
          保存しました
        </p>
      ) : null}

      <div className="org-store-intro__actions">
        <button type="submit" className="org-store-intro__save" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              保存中…
            </>
          ) : (
            "変更を保存"
          )}
        </button>
      </div>
    </form>
  );
}

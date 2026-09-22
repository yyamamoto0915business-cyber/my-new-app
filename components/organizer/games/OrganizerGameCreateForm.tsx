"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  CircleHelp,
  Flag,
  Loader2,
  MapPin,
  Plus,
  Puzzle,
  Smartphone,
  Stamp,
  Ticket,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { OrganizerGameCreatePreview } from "@/components/organizer/games/OrganizerGameCreatePreview";
import {
  DEFAULT_ORGANIZER_GAME_TYPE_ID,
  ORGANIZER_GAME_TYPES,
  getOrganizerGameType,
  isOrganizerGameTypeId,
  type OrganizerGameTypeId,
} from "@/lib/organizer/game-types";
import {
  MAX_ORGANIZER_GAME_SPOTS,
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";

type DraftSpot = {
  key: string;
  name: string;
  kind: OrganizerGameSpotKind;
};

function createDraftSpot(index: number): DraftSpot {
  return {
    key: crypto.randomUUID(),
    name: `スポット ${index + 1}`,
    kind: "stamp",
  };
}

const TYPE_ICONS: Record<OrganizerGameTypeId, LucideIcon> = {
  stamp: Stamp,
  quiz: CircleHelp,
  mystery: Puzzle,
  mission: Flag,
  photo: Camera,
  coupon: Ticket,
  checkin: MapPin,
};

function toIsoFromDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const hm = time.trim() || "00:00";
  const value = new Date(`${date}T${hm}:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

function formatPreviewPeriod(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): string | null {
  if (!startDate && !endDate) return null;
  const fmt = (date: string, time: string) => {
    if (!date) return "";
    const d = new Date(`${date}T${(time || "00:00")}:00+09:00`);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };
  const start = fmt(startDate, startTime);
  const end = fmt(endDate, endTime);
  if (start && end) return `${start} 〜 ${end}`;
  if (start) return `${start} から`;
  return `${end} まで`;
}

export function OrganizerGameCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type") ?? "";
  const selectedType = isOrganizerGameTypeId(requestedType)
    ? requestedType
    : DEFAULT_ORGANIZER_GAME_TYPE_ID;
  const selectedMeta = getOrganizerGameType(selectedType);

  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("16:00");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [spots, setSpots] = useState<DraftSpot[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/organizer/games?events=1&games=0", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        setEvents((json.events ?? []) as OrganizerGameEventOption[]);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const typeLockedMessage = selectedMeta.available
    ? null
    : `${selectedMeta.label}は準備中です。いまはスタンプラリーを作成できます。`;
  const typeId = selectedMeta.available ? selectedType : DEFAULT_ORGANIZER_GAME_TYPE_ID;
  const typeLabel = getOrganizerGameType(typeId).label;

  const descCount = description.length;
  const canSubmit = name.trim().length > 0 && !saving;
  const selectedEvent = events.find((event) => event.id === eventId) ?? null;
  const periodLabel = formatPreviewPeriod(startDate, startTime, endDate, endTime);

  const eventHint = useMemo(() => {
    if (loadingEvents) return "イベントを読み込み中です";
    if (events.length === 0) return "先にイベントを掲載すると、対象を選べます";
    return null;
  }, [loadingEvents, events.length]);
  const canAddSpot = spots.length < MAX_ORGANIZER_GAME_SPOTS;

  function addSpot() {
    if (!canAddSpot) return;
    setSpots((current) => [...current, createDraftSpot(current.length)]);
  }

  function updateSpot(key: string, patch: Partial<Pick<DraftSpot, "name" | "kind">>) {
    setSpots((current) =>
      current.map((spot) => (spot.key === key ? { ...spot, ...patch } : spot))
    );
  }

  function moveSpot(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= spots.length) return;
    setSpots((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function removeSpot(key: string) {
    setSpots((current) => current.filter((spot) => spot.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("ゲーム名を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: typeId,
          eventId: eventId || null,
          description: description.trim(),
          startsAt: toIsoFromDateTime(startDate, startTime),
          endsAt: toIsoFromDateTime(endDate, endTime),
          spots: spots.map((spot, index) => ({
            name: spot.name.trim() || `スポット ${index + 1}`,
            kind: spot.kind,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "作成に失敗しました");
        return;
      }
      router.push(`/organizer/games/${json.game.id}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="org-game-create">
      <Link
        href="/organizer/games"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
        ゲーム機能に戻る
      </Link>

      <OrganizerWorkspacePageHeader
        title="参加者向けゲームを作成"
        subtitle="名前とスポットを残します。保存すると、参加用QRとスポットQRを発行できます。"
        actions={
          <a href="#game-create-preview" className="org-game-create__preview-link">
            <Smartphone className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            プレビューで確認
          </a>
        }
      />

      <form className="org-game-create__form" onSubmit={(e) => void handleSubmit(e)}>
        <div className="org-game-create__layout">
          <div className="org-game-create__main">
            <section className="org-game-create__card" aria-labelledby="game-create-basic">
              <div className="org-game-create__card-head">
                <span>1</span>
                <div>
                  <h2 id="game-create-basic">基本情報</h2>
                  <p>名前と期間が、参加画面の見出しになります。</p>
                </div>
              </div>

              <div className="org-store-intro__grid">
                <label className="org-store-intro__field org-store-intro__field--full">
                  <span>
                    ゲーム名 <em>*</em>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={80}
                    placeholder="例: 春のまち歩きスタンプラリー"
                    autoFocus
                  />
                </label>

                <label className="org-store-intro__field org-store-intro__field--full">
                  <span>対象イベント</span>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={loadingEvents || events.length === 0}
                  >
                    <option value="">あとで選ぶ</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                        {event.date ? `（${event.date}）` : ""}
                      </option>
                    ))}
                  </select>
                  {eventHint ? <small>{eventHint}</small> : null}
                </label>

                <label className="org-store-intro__field">
                  <span>開始日</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="org-store-intro__field">
                  <span>開始時刻</span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </label>
                <label className="org-store-intro__field">
                  <span>終了日</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
                <label className="org-store-intro__field">
                  <span>終了時刻</span>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </label>

                <label className="org-store-intro__field org-store-intro__field--full">
                  <span>説明</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                    maxLength={300}
                    rows={4}
                    placeholder="会場周辺のスポットを巡ってスタンプを集めよう"
                  />
                  <small>{descCount}/300</small>
                </label>
              </div>
            </section>

            <section className="org-game-create__card" aria-labelledby="game-create-type">
              <div className="org-game-create__card-head">
                <span>2</span>
                <div>
                  <h2 id="game-create-type">ゲームタイプ</h2>
                  <p>いま作れるのはスタンプラリーです。タイプは1つだけ選べます。</p>
                </div>
              </div>

              <ul className="org-game-create__types">
                {ORGANIZER_GAME_TYPES.map((type) => {
                  const Icon = TYPE_ICONS[type.id];
                  const selected = type.id === typeId;
                  return (
                    <li key={type.id}>
                      <div
                        className={cn(
                          "org-game-create__type",
                          selected && "is-selected",
                          !type.available && "is-soon"
                        )}
                        aria-current={selected ? "true" : undefined}
                        aria-disabled={!type.available}
                      >
                        <span className="org-game-create__type-icon" aria-hidden>
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                        <span className="org-game-create__type-label">{type.label}</span>
                        {type.available ? (
                          <span className="org-game-create__type-state">選択中</span>
                        ) : (
                          <span className="org-game-create__type-state">準備中</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {typeLockedMessage ? <p className="org-game-create__note">{typeLockedMessage}</p> : null}
            </section>

            <section className="org-game-create__card" aria-labelledby="game-create-spots">
              <div className="org-game-create__card-head">
                <span>3</span>
                <div>
                  <h2 id="game-create-spots">スポット設定</h2>
                  <p>巡る場所を追加してください。上下で並び替えできます。</p>
                </div>
              </div>

              {spots.length === 0 ? (
                <div className="org-game-create__empty">
                  <p>まだスポットがありません。会場や商店街の場所を追加しましょう。</p>
                </div>
              ) : (
                <div className="org-game-create__spots">
                  <div className="org-game-create__spots-head" aria-hidden>
                    <span>スポット名</span>
                    <span>種別</span>
                    <span>QR</span>
                  </div>
                  <ol className="org-game-create__spot-list">
                    {spots.map((spot, index) => (
                      <li key={spot.key} className="org-game-create__spot">
                        <div className="org-game-create__spot-index">{index + 1}</div>
                        <label className="org-game-create__spot-name">
                          <span>スポット名</span>
                          <input
                            type="text"
                            value={spot.name}
                            maxLength={40}
                            onChange={(e) => updateSpot(spot.key, { name: e.target.value })}
                            placeholder={`スポット ${index + 1}`}
                          />
                        </label>
                        <label className="org-game-create__spot-kind">
                          <span>種別</span>
                          <select
                            value={spot.kind}
                            onChange={(e) =>
                              updateSpot(spot.key, {
                                kind: e.target.value as OrganizerGameSpotKind,
                              })
                            }
                          >
                            {Object.entries(ORGANIZER_GAME_SPOT_KIND_LABEL).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p className="org-game-create__spot-qr">
                          <span>QR</span>
                          保存後に発行
                        </p>
                        <div className="org-game-create__spot-tools">
                          <button
                            type="button"
                            aria-label="上へ"
                            disabled={index === 0}
                            onClick={() => moveSpot(index, -1)}
                          >
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="下へ"
                            disabled={index === spots.length - 1}
                            onClick={() => moveSpot(index, 1)}
                          >
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="削除"
                            onClick={() => removeSpot(spot.key)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="org-game-create__spot-add">
                <button
                  type="button"
                  className="org-game-create__add"
                  onClick={addSpot}
                  disabled={!canAddSpot}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  スポットを追加
                </button>
                {!canAddSpot ? (
                  <p className="org-game-create__note">スポットは{MAX_ORGANIZER_GAME_SPOTS}件までです。</p>
                ) : (
                  <p className="org-game-create__note">QRは下書き保存のあと、編集画面で発行します。</p>
                )}
              </div>
            </section>

            <p className="org-game-create__hint">
              下書き保存すると、参加用QRとスポットQRを発行できます。参加者はニックネームと合言葉で再開できます。
            </p>
            {error ? <p className="org-store-intro__error">{error}</p> : null}
            <div className="org-game-create__actions">
              <button type="submit" className="org-store-intro__save" disabled={!canSubmit}>
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    保存中…
                  </>
                ) : (
                  "下書き保存"
                )}
              </button>
            </div>
          </div>

          <OrganizerGameCreatePreview
            name={name}
            description={description}
            typeLabel={typeLabel}
            periodLabel={periodLabel}
            eventTitle={selectedEvent?.title ?? null}
            spots={spots.map((spot) => ({
              key: spot.key,
              name: spot.name,
              kindLabel: ORGANIZER_GAME_SPOT_KIND_LABEL[spot.kind],
            }))}
          />
        </div>
      </form>
    </div>
  );
}

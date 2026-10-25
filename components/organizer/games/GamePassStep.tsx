"use client";

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { CalendarDays, Gamepad2, KeyRound, MapPin, Repeat, Ticket, UserCheck, Users } from "lucide-react";
import type { GameAudienceChoice } from "@/components/organizer/games/AudienceField";
import type { GameParticipationChoice } from "@/components/organizer/games/ParticipationField";
import { GameImageField } from "@/components/organizer/games/GameImageField";
import { GAME_PASS_NOTE_MAX } from "@/lib/organizer/game-pass";
import { GamePassTicket } from "@/components/pass/PassGamesSection";
import { gamePassPeriodLabel, type ParticipationPass } from "@/lib/participation-pass";

/** 作成画面で入力中の参加パスの設定（入力欄の文字のまま持つ）。 */
export type GamePassDraft = {
  /** 定員（空は上限なし）。 */
  capacity: string;
  /** 締め切り（datetime-local の値。空は締め切りなし）。 */
  deadline: string;
  note: string;
};

/** 遊べる回数。1人1回はログインしたアカウントで1回、何度でもはログインなしでも参加できる。 */
export type GamePlayLimitChoice = "once" | "repeat";

export const EMPTY_GAME_PASS_DRAFT: GamePassDraft = { capacity: "", deadline: "", note: "" };

/** 保存した設定（settings.pass）を、入力欄の値に戻す。 */
export function gamePassDraftFromSettings(raw: unknown): GamePassDraft {
  if (!raw || typeof raw !== "object") return EMPTY_GAME_PASS_DRAFT;
  const row = raw as { capacity?: unknown; deadline?: unknown; note?: unknown };
  let deadline = "";
  if (typeof row.deadline === "string" && !Number.isNaN(Date.parse(row.deadline))) {
    // 日本時間の YYYY-MM-DDTHH:mm
    const jst = new Date(Date.parse(row.deadline) + 9 * 3600000);
    deadline = jst.toISOString().slice(0, 16);
  }
  return {
    capacity: typeof row.capacity === "number" ? String(row.capacity) : "",
    deadline,
    note: typeof row.note === "string" ? row.note : "",
  };
}

/** 入力欄の値を、保存する形（settings.pass）にする。 */
export function gamePassBody(draft: GamePassDraft): { capacity: number | null; deadline: string | null; note: string } {
  const capacity = Number(draft.capacity);
  const deadline = draft.deadline ? new Date(`${draft.deadline}:00+09:00`) : null;
  return {
    capacity: draft.capacity.trim() && Number.isFinite(capacity) && capacity >= 1 ? Math.round(capacity) : null,
    deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline.toISOString() : null,
    note: draft.note.trim(),
  };
}

const label = { fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" } as const;
const input = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  border: "1.5px solid #e2ebe5",
  borderRadius: "0.75rem",
  background: "#fff",
  fontSize: "0.9rem",
  fontFamily: "inherit",
} as const;
const card = {
  display: "grid",
  gap: "0.7rem",
  padding: "0.9rem 1rem",
  border: "1px solid #e2ebe5",
  borderRadius: "1rem",
  background: "#fff",
} as const;
const heading = { margin: 0, fontSize: "0.92rem", fontWeight: 800, color: "#1a2214" } as const;

/** 横に並ぶ大きめの選択肢（2つ）。 */
function ChoiceRow<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T | null;
  options: { id: T; label: string; blurb: string; icon: ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              padding: "0.75rem 0.8rem",
              border: `1.5px solid ${on ? "#1f7a4a" : "#e2ebe5"}`,
              borderRadius: "0.85rem",
              background: on ? "#f3faf5" : "#fff",
              boxShadow: on ? "0 0 0 3px rgba(31,122,74,0.12)" : "none",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span
              aria-hidden
              style={{
                display: "grid",
                placeItems: "center",
                flex: "none",
                width: "2rem",
                height: "2rem",
                borderRadius: "0.6rem",
                background: on ? "#1f7a4a" : "#eef4f0",
                color: on ? "#fff" : "#5d6b62",
              }}
            >
              {option.icon}
            </span>
            <span style={{ display: "grid", gap: "0.15rem", minWidth: 0 }}>
              <b style={{ fontSize: "0.88rem", color: "#1a2214" }}>{option.label}</b>
              <small style={{ fontSize: "0.72rem", lineHeight: 1.45, color: "#6a7568" }}>{option.blurb}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 作成画面の「参加パス」の手順。イベントとは別に、ゲームだけで申し込みを受け付ける。
 * 申し込んだ人には参加パスが届き、そこからゲームを始める。
 * よく使う「誰でも／申し込んだ人だけ」を大きく出し、イベントで絞る選び方は折りたたむ。
 */
export function GamePassStep({
  audience,
  onAudience,
  eventChosen,
  participation,
  onParticipation,
  onsiteOnly = false,
  playLimit,
  onPlayLimit,
  pass,
  onPass,
  image,
  onImage,
  gameId,
}: {
  audience: GameAudienceChoice;
  onAudience: (value: GameAudienceChoice) => void;
  eventChosen: boolean;
  participation: GameParticipationChoice;
  onParticipation: (value: GameParticipationChoice) => void;
  /** スタンプラリーはスポットを回るので、いつも現地。 */
  onsiteOnly?: boolean;
  /** 遊べる回数。スタンプラリーは自分の画面で選ぶので渡さない。 */
  playLimit?: GamePlayLimitChoice;
  onPlayLimit?: (value: GamePlayLimitChoice) => void;
  pass: GamePassDraft;
  onPass: (value: GamePassDraft) => void;
  /** 参加パス（とまちの情報のカード）に出す画像。 */
  image: string;
  onImage: (url: string) => void;
  gameId?: string | null;
}) {
  const entry = audience === "entry";
  const byEvent = audience === "event" || audience === "pass";

  return (
    <div style={{ display: "grid", gap: "0.9rem" }}>
      <div style={card}>
        <p style={heading}>1. 申し込み</p>
        <ChoiceRow<"anyone" | "entry">
          name="申し込み"
          value={byEvent ? null : (audience as "anyone" | "entry")}
          onChange={onAudience}
          options={[
            { id: "anyone", label: "申し込みなし", blurb: "誰でもQRから参加できます", icon: <Users style={{ width: "1rem", height: "1rem" }} /> },
            { id: "entry", label: "申し込みあり", blurb: "申し込んだ人に参加パスが届きます", icon: <Ticket style={{ width: "1rem", height: "1rem" }} /> },
          ]}
        />

        {entry ? (
          <div style={{ display: "grid", gap: "0.7rem", padding: "0.8rem", borderRadius: "0.85rem", background: "#f7faf8" }}>
            <div style={{ display: "grid", gap: "0.7rem", gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))" }}>
              <label style={{ display: "grid", gap: "0.3rem" }}>
                <span style={label}>定員</span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="上限なし"
                    value={pass.capacity}
                    onChange={(e) => onPass({ ...pass, capacity: e.target.value })}
                    style={input}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#3c4a40" }}>人</span>
                </span>
              </label>
              <label style={{ display: "grid", gap: "0.3rem" }}>
                <span style={label}>締め切り</span>
                <input
                  type="datetime-local"
                  value={pass.deadline}
                  onChange={(e) => onPass({ ...pass, deadline: e.target.value })}
                  style={input}
                />
              </label>
            </div>
            <label style={{ display: "grid", gap: "0.3rem" }}>
              <span style={label}>注意書き（申し込む前の画面と参加パスに出ます）</span>
              <textarea
                rows={2}
                maxLength={GAME_PASS_NOTE_MAX}
                placeholder="例：歩きやすい靴でご参加ください。"
                value={pass.note}
                onChange={(e) => onPass({ ...pass, note: e.target.value })}
                style={{ ...input, resize: "vertical", lineHeight: 1.6 }}
              />
            </label>
            <small style={{ fontSize: "0.72rem", color: "#6a7568" }}>どれも空のままでかまいません（上限なし・締め切りなし）。</small>
          </div>
        ) : null}

        <details open={byEvent} style={{ fontSize: "0.8rem", color: "#3c4a40" }}>
          <summary style={{ cursor: "pointer", fontWeight: 700, color: "#5d6b62" }}>
            イベントの申し込みで絞る（イベントと一緒に開くとき）
          </summary>
          <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.6rem" }}>
            {(
              [
                { id: "event", label: "イベントの参加者だけ", blurb: "対象イベントに申し込んだ人が入れます" },
                { id: "pass", label: "参加パスを持っている人だけ", blurb: "対象イベントの参加パス（支払い済み・スタッフ）を持つ人が入れます" },
              ] as const
            ).map((option) => (
              <label key={option.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="game-pass-audience-event"
                  checked={audience === option.id}
                  onChange={() => onAudience(option.id)}
                  style={{ marginTop: "0.2rem", accentColor: "#1f7a4a" }}
                />
                <span>
                  <b style={{ color: "#1a2214" }}>{option.label}</b>
                  <span style={{ display: "block", fontSize: "0.72rem", color: "#6a7568" }}>{option.blurb}</span>
                </span>
              </label>
            ))}
            {byEvent ? (
              <small style={{ fontSize: "0.72rem", lineHeight: 1.5, color: eventChosen ? "#5d6b62" : "#c0392b", fontWeight: eventChosen ? 500 : 800 }}>
                {eventChosen
                  ? "参加者はログインしてから入ります。"
                  : "基本設定で「対象イベント」を選んでください。選ぶまでは、誰も入れません。"}
              </small>
            ) : null}
          </div>
        </details>

        {playLimit && onPlayLimit ? (
          <div style={{ display: "grid", gap: "0.45rem", paddingTop: "0.7rem", borderTop: "1px solid #eef2ef" }}>
            <span style={label}>遊べる回数</span>
            <ChoiceRow<GamePlayLimitChoice>
              name="遊べる回数"
              value={playLimit}
              onChange={onPlayLimit}
              options={[
                { id: "once", label: "1人1回", blurb: "ログインしたアカウントで1回だけ遊べます", icon: <UserCheck style={{ width: "1rem", height: "1rem" }} /> },
                { id: "repeat", label: "何度でも（登録なしでも遊べる）", blurb: "ニックネームと合言葉だけで遊べます。machiglyphの登録は要りません", icon: <Repeat style={{ width: "1rem", height: "1rem" }} /> },
              ]}
            />
            {playLimit === "repeat" && audience !== "anyone" ? (
              <small style={{ fontSize: "0.72rem", lineHeight: 1.5, color: "#8a5a00" }}>
                参加できる人を絞っているので、参加者はログインしてから入ります。登録なしで遊べるのは「申し込みなし」のときです。
              </small>
            ) : playLimit === "once" && audience === "anyone" ? (
              <small style={{ fontSize: "0.72rem", lineHeight: 1.5, color: "#5d6b62" }}>
                1人1回にすると、参加者はmachiglyphにログインしてから遊びます。登録なしで遊んでほしいときは「何度でも」を選んでください。
              </small>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={card}>
        <p style={heading}>2. 参加のしかた</p>
        {onsiteOnly ? (
          <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.84rem", color: "#3c4a40" }}>
            <MapPin style={{ width: "1rem", height: "1rem", color: "#1f7a4a" }} aria-hidden />
            スタンプラリーは、現地でスポットのQRを読んで参加します。
          </p>
        ) : (
          <ChoiceRow<GameParticipationChoice>
            name="参加のしかた"
            value={participation}
            onChange={onParticipation}
            options={[
              { id: "onsite", label: "現地で参加", blurb: "会場やスポットのQRを読んで始めます", icon: <MapPin style={{ width: "1rem", height: "1rem" }} /> },
              { id: "remote", label: "どこからでも参加", blurb: "参加パスに出る参加コードで始めます", icon: <KeyRound style={{ width: "1rem", height: "1rem" }} /> },
            ]}
          />
        )}
      </div>

      <div style={card}>
        <p style={heading}>3. 参加パスの画像</p>
        <small style={{ fontSize: "0.74rem", lineHeight: 1.55, color: "#5d6b62" }}>
          参加パスと、まちの情報のカードに出ます。選ばないときは種類の絵になります。届く参加パスは、右のプレビューで確かめられます。
        </small>
        {/* 大きく出しすぎないよう、画像の欄は幅を抑える。 */}
        <div style={{ width: "100%", maxWidth: "18rem" }}>
          <GameImageField label="参加パスの画像" url={image} gameId={gameId} onChange={onImage} />
        </div>
        {image ? (
          <button
            type="button"
            onClick={() => onImage("")}
            style={{ justifySelf: "start", border: 0, background: "transparent", padding: 0, fontSize: "0.76rem", fontWeight: 700, color: "#a14646", cursor: "pointer" }}
          >
            画像を外す
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** 届く参加パスの見本。参加パスの画面と同じ部品（GamePassTicket）で出す。 */
export function GamePassPreview({
  image,
  fallbackImage,
  name,
  typeLabel,
  startAt,
  endAt,
  participation,
  entry,
  note,
}: {
  image: string;
  fallbackImage: string;
  name: string;
  typeLabel: string;
  /** ゲームの期間（ISO）。なければ、申し込んだ日がパスの日付になる。 */
  startAt: string | null;
  endAt: string | null;
  participation: GameParticipationChoice;
  /** 申し込みありか。なしのときは薄く出して、届かないことを伝える。 */
  entry: boolean;
  note: string;
}) {
  const now = new Date().toISOString();
  const start = startAt ?? now;
  const pass: ParticipationPass = {
    id: "preview",
    eventId: "preview",
    eventTitle: name.trim() || "ゲーム名",
    eventImage: image || fallbackImage,
    startAt: start,
    endAt: endAt ?? start,
    venueName: participation === "remote" ? "どこからでも参加（参加コード）" : "現地で参加（QR）",
    attendeeName: "参加者の名前",
    receptionNumber: "MG-00000000",
    paymentStatus: "free",
    receptionType: "qr",
    ticketLabel: "参加者",
    quantity: 1,
    status: "upcoming",
    kind: "game",
    game: {
      gameId: "preview",
      typeLabel,
      participation,
      joinPath: "#",
      joinCode: participation === "remote" ? "ABC123" : null,
      note: note.trim() || undefined,
      periodLabel: gamePassPeriodLabel(startAt, endAt),
    },
  };
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: "0.7rem", width: "100%", padding: "0.5rem 0 1rem" }} aria-label="参加パスの見本">
      <p style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.8rem", borderRadius: "999px", background: "#eef8f1", fontSize: "0.78rem", fontWeight: 800, color: "#1f7a4a" }}>
        <Ticket style={{ width: "0.9rem", height: "0.9rem" }} aria-hidden />
        届く参加パスの見本
      </p>
      {/* 見本なので、押しても動かないようにする。 */}
      <div style={{ width: "min(100%, 22rem)", pointerEvents: "none", opacity: entry ? 1 : 0.55 }} aria-hidden>
        <GamePassTicket pass={pass} />
      </div>
      <p style={{ margin: 0, maxWidth: "22rem", textAlign: "center", fontSize: "0.74rem", lineHeight: 1.6, color: entry ? "#5d6b62" : "#8a5a00" }}>
        {entry
          ? "申し込んだ人の「参加パス」に、この形で届きます。名前と受付番号は、申し込んだ人のものになります。"
          : "いまは「申し込みなし」なので、参加パスは届きません。「申し込みあり」にすると、この形で届きます。"}
      </p>
    </div>
  );
}

/** 開始日・終了日（YYYY-MM-DD）を「10/25 〜 11/30」の形で。 */
export function periodText(startDate: string, endDate: string): string {
  const fmt = (ymd: string) => {
    const [, m, d] = ymd.split("-");
    return m && d ? `${Number(m)}/${Number(d)}` : "";
  };
  const start = startDate ? fmt(startDate) : "";
  const end = endDate ? fmt(endDate) : "";
  if (start && end) return `${start} 〜 ${end}`;
  return start || end;
}

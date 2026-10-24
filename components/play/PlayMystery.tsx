"use client";

import { RewardLine } from "@/components/play/RewardLine";
import dynamic from "next/dynamic";
import { useState, type CSSProperties } from "react";
import { LocateFixed, Lightbulb, MapPin } from "lucide-react";
import type { PlaySpotProgress } from "@/lib/organizer/play-types";
import "@/components/play/rally/rally.css";

const RallyVectorMap = dynamic(
  () => import("@/components/play/rally/RallyVectorMap").then((mod) => mod.RallyVectorMap),
  { ssr: false, loading: () => <div className="rally-map__canvas" /> },
);

const MAP_VARS = {
  "--rally-green": "#1f7a4a",
  "--rally-green-soft": "#e7f4ec",
  "--rally-line": "#e2ebe5",
  "--rally-muted": "#66726a",
  "--rally-red": "#d9452b",
} as CSSProperties;
import type { PublicMysteryPlay, PublicMysteryStep } from "@/lib/organizer/mystery-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { readPlaySession } from "@/lib/organizer/play-session";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type Props = {
  token: string;
  mystery: PublicMysteryPlay;
  progress: PlayProgress;
  onProgress: (progress: PlayProgress) => void;
};

export function PlayMystery({ token, mystery, progress, onProgress }: Props) {
  const solved = progress.mystery?.solved ?? [];
  const needed = progress.mystery?.needed ?? mystery.needed;
  const rewards = progress.mystery?.rewards ?? mystery.rewards;
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<PlayProgress | null>(null);
  const copy = usePlayCopy();
  /** 着いて開いた謎と、答えるときに一緒に送る証し（クイズのチェックポイントと同じ）。 */
  const [opened, setOpened] = useState<
    Record<number, { step: PublicMysteryStep; here: { lat: number; lng: number } | null; keyword: string }>
  >({});
  const [gateKeyword, setGateKeyword] = useState("");
  const [gateBusy, setGateBusy] = useState(false);
  const [gateNote, setGateNote] = useState<string | null>(null);
  /** 謎とマップの切り替え（スタンプラリーのマップと同じ地図）。 */
  const [view, setView] = useState<"puzzle" | "map">("puzzle");
  /** 開いている謎（好きな順に解ける）。null なら一覧。 */
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);
  const [recenter, setRecenter] = useState(0);
  const [pinId, setPinId] = useState<string | null>(null);
  const [mapNote, setMapNote] = useState<string | null>(null);
  const [flatMap, setFlatMap] = useState(false);

  async function openCheckpoint(step: PublicMysteryStep, here: { lat: number; lng: number } | null) {
    const stored = readPlaySession(token);
    if (!stored) {
      setGateNote("先に参加用QRから入ってください");
      return;
    }
    setGateBusy(true);
    setGateNote(null);
    try {
      const keyword = gateKeyword.trim();
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mystery-open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: stored.deviceToken, stepIndex: step.index, here, keyword }),
      });
      const json = (await res.json()) as { step?: PublicMysteryStep; error?: string };
      if (!res.ok || !json.step) {
        setGateNote(json.error ?? "その場所に着いたか確かめられませんでした");
        return;
      }
      setOpened((current) => ({ ...current, [step.index]: { step: json.step!, here, keyword } }));
      setGateKeyword("");
    } catch {
      setGateNote("通信エラーが発生しました");
    } finally {
      setGateBusy(false);
    }
  }

  function checkHere(step: PublicMysteryStep) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGateNote("この端末では現在地を取れません");
      return;
    }
    setGateBusy(true);
    setGateNote("現在地を確認しています…");
    navigator.geolocation.getCurrentPosition(
      (position) =>
        void openCheckpoint(step, {
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
        }),
      () => {
        setGateBusy(false);
        setGateNote("現在地を取得できませんでした。位置情報を許可して、もう一度押してください。");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  // 好きな順に解ける。開いた謎（まだ解いていないもの）があれば、それを出す。
  const current =
    activeIndex != null && !solved.includes(activeIndex)
      ? (mystery.steps.find((step) => step.index === activeIndex) ?? null)
      : null;

  async function submit(step: PublicMysteryStep) {
    if (saving || held) return;
    const stored = readPlaySession(token);
    if (!stored) {
      setError("先に参加用QRから入ってください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/mystery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: stored.deviceToken,
          stepIndex: step.index,
          answer,
          here: opened[step.index]?.here ?? null,
          keyword: opened[step.index]?.keyword ?? "",
        }),
      });
      const json = (await res.json()) as {
        done?: boolean;
        note?: string;
        hint?: string;
        progress?: PlayProgress;
        error?: string;
      };
      if (!res.ok || !json.progress) {
        setError(json.error ?? "答えを保存できませんでした");
        return;
      }
      if (!json.done) {
        setNote(json.note || "ちがいます。もう一度どうぞ。");
        setHint(json.hint ?? "");
        return;
      }
      setAnswer("");
      setNote(null);
      setHint("");
      setHeld(json.progress);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (!held) return;
    onProgress(held);
    setHeld(null);
    setActiveIndex(null);
  }

  function openStep(index: number) {
    setActiveIndex(index);
    setView("puzzle");
    setAnswer("");
    setNote(null);
    setHint("");
    setError(null);
    setGateNote(null);
  }

  if (progress.completed) {
    return (
      <div className="play-quiz">
        <p className="game-test__kicker">{copy.cleared}</p>
        <h2>{copy.mysteryDone}</h2>
        <p>{copy.mysteryScore(mystery.steps.length, solved.length)}</p>
        {progress.rewardUsed ? (
          <p className="play-clear__used">{copy.used}</p>
        ) : progress.rewardCode ? (
          <>
            {/* 何のコードかが分かるように。クーポンがなく景品だけのときは、景品の引き換えコード。 */}
            <p className="game-test__kicker" style={{ margin: "0.8rem 0 0" }}>
              {copy.msg(rewards.some((line) => line.startsWith("クーポン")) ? "クーポンのコード" : "景品の引き換えコード")}
            </p>
            <p className="play-clear__code">{progress.rewardCode}</p>
            <p className="play-clear__code-note">{copy.showCode}</p>
          </>
        ) : null}
        {rewards.map((line) => (
          <RewardLine key={line} text={line}>{copy.msg(line)}</RewardLine>
        ))}
      </div>
    );
  }

  if (mystery.steps.length === 0) return <p>{copy.noPuzzles}</p>;

  const pinned = mystery.steps.filter((step) => step.lat != null && step.lng != null);
  // マップはいつでも開ける（場所を決めた謎がなくても、地図と現在地は見られる）。
  const segment = (
      <div className="rally-segment" role="tablist" style={{ ...MAP_VARS, marginBottom: "0.7rem" }}>
        <button type="button" role="tab" aria-selected={view === "puzzle"} onClick={() => setView("puzzle")}>
          {copy.msg("謎")}
        </button>
        <button type="button" role="tab" aria-selected={view === "map"} onClick={() => setView("map")}>
          {copy.msg("マップ")}
        </button>
      </div>
  );

  if (view === "map") {
    const spots: PlaySpotProgress[] = pinned.map((step) => {
      const order = mystery.steps.findIndex((item) => item.index === step.index) + 1;
      return {
        id: `m${step.index}`,
        name: `${order}. ${step.place || step.checkpoint?.place || `${copy.msg("謎")} ${order}`}`,
        kind: "stamp",
        kindLabel: copy.msg("謎"),
        stamped: solved.includes(step.index),
        checkin: "gps",
        lat: step.lat,
        lng: step.lng,
        icon: "stamp",
      };
    });
    const picked = pinned.find((step) => `m${step.index}` === pinId) ?? null;
    const pickedOrder = picked ? mystery.steps.findIndex((item) => item.index === picked.index) + 1 : 0;
    const pickedState = picked ? (solved.includes(picked.index) ? "解きました" : "まだ解いていません") : "";
    const locate = () => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setMapNote("この端末では現在地を取れません");
        return;
      }
      setMapNote(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHere({ lat: position.coords.latitude, lng: position.coords.longitude });
          setRecenter((count) => count + 1);
        },
        () => setMapNote("現在地を取得できませんでした。位置情報の利用を許可してください。"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    };
    return (
      <div className="play-quiz">
        {segment}
        <div className="rally-map" style={{ ...MAP_VARS, position: "relative", height: "24rem", borderRadius: "1rem", overflow: "hidden" }}>
          {flatMap ? (
            <p className="rally-map__empty">{copy.msg("地図を表示できませんでした。")}</p>
          ) : (
            <RallyVectorMap
              spots={spots}
              selectedId={pinId}
              here={here}
              onSelect={setPinId}
              label={copy.msg("マップ")}
              recenter={recenter}
              onUnavailable={() => setFlatMap(true)}
            />
          )}
          <button
            type="button"
            className={here ? "rally-map__locate is-on" : "rally-map__locate"}
            onClick={locate}
            aria-label={copy.msg("現在地")}
          >
            <LocateFixed aria-hidden />
          </button>
          {mapNote ? <p className="rally-map__notice">{copy.msg(mapNote)}</p> : null}
        </div>
        {pinned.length === 0 ? (
          <p className="game-test__meta" style={{ marginTop: "0.6rem" }}>
            {copy.msg("地図に出る場所は、まだありません。")}
          </p>
        ) : picked ? (
          <div className="game-test__note" style={{ display: "grid", gap: "0.35rem", marginTop: "0.6rem" }}>
            <b>
              {pickedOrder}. {picked.place || picked.checkpoint?.place}
            </b>
            <span>{copy.msg(pickedState)}</span>
            {!solved.includes(picked.index) ? (
              <button type="button" className="play-dock__go" onClick={() => openStep(picked.index)}>
                {copy.msg("この謎へ")}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="game-test__meta" style={{ marginTop: "0.6rem" }}>
            {copy.msg("好きな順に回れます。ピンを押すと、その謎を開けます。")}
          </p>
        )}
      </div>
    );
  }

  if (!current) {
    return (
      <div className="play-quiz">
        {segment}
        <div className="game-test__top">
          <p>
            {solved.length} / {needed} {copy.questions}
          </p>
          <span>{copy.msg("好きな謎から解けます")}</span>
        </div>
        <ul style={{ display: "grid", gap: "0.5rem", margin: "0.4rem 0 0", padding: 0, listStyle: "none" }}>
          {mystery.steps.map((step, order) => {
            const done = solved.includes(step.index);
            const name = step.place || step.checkpoint?.place || `${copy.msg("謎")} ${order + 1}`;
            return (
              <li key={step.index}>
                <button
                  type="button"
                  disabled={done}
                  onClick={() => openStep(step.index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.7rem",
                    width: "100%",
                    padding: "0.65rem 0.8rem",
                    border: `1.5px solid ${done ? "#b7e4c4" : "#e2ebe5"}`,
                    borderRadius: "0.9rem",
                    background: done ? "#eef7f1" : "#fff",
                    textAlign: "left",
                    cursor: done ? "default" : "pointer",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: "inline-flex",
                      flex: "none",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      background: done ? "#1f7a4a" : "#e7f4ec",
                      color: done ? "#fff" : "#1f7a4a",
                      fontWeight: 900,
                      fontSize: "0.85rem",
                    }}
                  >
                    {done ? "✓" : order + 1}
                  </span>
                  <span style={{ display: "grid", gap: "0.1rem", minWidth: 0 }}>
                    <b style={{ fontSize: "0.92rem", color: "#1a2214" }}>{name}</b>
                    <small style={{ fontSize: "0.72rem", color: done ? "#1f7a4a" : "#66726a" }}>
                      {done
                        ? copy.msg("解きました")
                        : step.checkpoint
                          ? copy.msg("着いたら開く謎")
                          : copy.msg("タップして解く")}
                    </small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const place = mystery.steps.findIndex((step) => step.index === current.index) + 1;
  const heldSolved = held?.mystery?.solved.length ?? solved.length;
  const shown = opened[current.index]?.step ?? current;

  if (shown.checkpoint?.locked) {
    const checkpoint = shown.checkpoint;
    return (
      <div className="play-quiz">
        {segment}
        <button
          type="button"
          onClick={() => setActiveIndex(null)}
          style={{ alignSelf: "flex-start", margin: "0 0 0.4rem", padding: 0, border: 0, background: "none", color: "#1f7a4a", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
        >
          ← {copy.msg("謎の一覧へ")}
        </button>
        <div className="game-test__top">
          <p>
            {solved.length} / {needed} {copy.questions}
          </p>
          <span>
            {place} / {mystery.steps.length}
          </span>
        </div>
        <div className="play-quiz__gate">
          <span className="play-quiz__gate-icon" aria-hidden>
            <MapPin />
          </span>
          <p className="play-quiz__gate-kicker">{copy.msg("チェックポイント")}</p>
          {checkpoint.place ? <h2>{checkpoint.place}</h2> : null}
          <p>{copy.msg("この場所に着くと、謎が出ます。")}</p>
          {checkpoint.arrival === "keyword" ? (
            <form
              className="play-quiz__gate-form"
              onSubmit={(event) => {
                event.preventDefault();
                void openCheckpoint(current, null);
              }}
            >
              <p>{copy.msg("現地にある合言葉を入れると、謎が開きます。")}</p>
              <input
                value={gateKeyword}
                maxLength={40}
                aria-label={copy.msg("合言葉")}
                placeholder={copy.msg("合言葉")}
                onChange={(event) => setGateKeyword(event.target.value)}
              />
              <button type="submit" className="play-dock__go" disabled={gateBusy || !gateKeyword.trim()}>
                {copy.msg("謎を開く")}
              </button>
            </form>
          ) : (
            <div className="play-quiz__gate-form">
              <p>{copy.msg("着いたら、現在地で確かめます。")}</p>
              <button type="button" className="play-dock__go" disabled={gateBusy} onClick={() => checkHere(current)}>
                {copy.msg("現在地で確かめる")}
              </button>
            </div>
          )}
          {gateNote ? <p className="play-quiz__gate-note">{copy.msg(gateNote)}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="play-quiz">
      {segment}
      <button
        type="button"
        onClick={() => setActiveIndex(null)}
        style={{ alignSelf: "flex-start", margin: "0 0 0.4rem", padding: 0, border: 0, background: "none", color: "#1f7a4a", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer" }}
      >
        ← {copy.msg("謎の一覧へ")}
      </button>
      <div className="game-test__top">
        <p>
          {solved.length} / {needed} {copy.questions}
        </p>
        <span>
          {place} / {mystery.steps.length}
        </span>
      </div>
      {shown.checkpoint ? (
        <p className="game-test__note is-right">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {copy.msg("着きました。謎に答えてください。")}
        </p>
      ) : null}
      {shown.imageUrl ? <img className="game-test__photo" src={shown.imageUrl} alt="" /> : null}
      {shown.place ? <p className="game-test__meta">{shown.place}</p> : null}
      <h2>{shown.prompt}</h2>
      {held ? <p className="game-test__note is-right">{copy.correctSaved}</p> : null}
      {held ? null : (
        <input
          className="game-test__field"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={copy.answerPlaceholder}
          aria-label={copy.answerPlaceholder}
        />
      )}
      {note && !held ? (
        <p className="game-test__note">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden />
          {hint ? `${copy.msg(note)} ${hint}` : copy.msg(note)}
        </p>
      ) : null}
      {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
      <div className="play-dock">
        {held ? (
          <button type="button" className="play-dock__go" onClick={goNext}>
            {heldSolved >= needed ? copy.seeResults : copy.msg("謎の一覧へ")}
          </button>
        ) : (
          <button type="button" className="play-dock__go" disabled={saving} onClick={() => void submit(current)}>
            {saving ? copy.recording : copy.msg("答える")}
          </button>
        )}
      </div>
    </div>
  );
}

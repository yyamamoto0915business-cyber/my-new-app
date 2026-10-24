"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PlayMission } from "@/components/play/PlayMission";
import { PlayMystery } from "@/components/play/PlayMystery";
import { PlayCheckin } from "@/components/play/PlayCheckin";
import { PlayCoupon } from "@/components/play/PlayCoupon";
import { PlayPhoto } from "@/components/play/PlayPhoto";
import { PlayQuiz } from "@/components/play/PlayQuiz";
import { ClearLayer, GameLookBackdrop, GameSceneBand, gamePlayProgress, GameLookIconMark, GameStartHeader, PlayLookHead, gameLookClass } from "@/components/play/GameLook";
import { PlayProgressCard } from "@/components/play/PlayProgressCard";
import { RallyApp } from "@/components/play/rally/RallyApp";
import { RallyStartScreen } from "@/components/play/rally/RallyStartScreen";
import type { PlayStart, RallyStampEvent } from "@/components/play/rally/types";
import {
  GAME_HOWTO_ICONS,
  readPublicPlayMoment,
  sanitizeStartImages,
  sanitizeStartShapes,
  safeImageUrl,
  type GameHowtoIcon,
  type PublicPlayMoment,
} from "@/lib/organizer/game-experience";
import {
  PLAY_NICKNAME_MAX,
  PLAY_PASSPHRASE_MAX,
  PLAY_PASSPHRASE_MIN,
  type PlayProgress,
  type PlaySession,
  type PlayStampResult,
} from "@/lib/organizer/play-types";
import {
  clearPlaySession,
  readPlaySession,
  writePlaySession,
} from "@/lib/organizer/play-session";
import { useWatchCouponUse } from "@/components/play/useWatchCouponUse";
import { readPublicMission, type PublicMissionPlay } from "@/lib/organizer/mission-play";
import { readPublicMystery, type PublicMysteryPlay } from "@/lib/organizer/mystery-play";
import { readPublicCheckin, type PublicCheckinPlay } from "@/lib/organizer/checkin-play";
import { readPublicCoupon, type PublicCouponPlay } from "@/lib/organizer/coupon-play";
import { readPublicPhoto, type PublicPhotoPlay } from "@/lib/organizer/photo-play";
import { readPublicQuiz, type PublicQuiz } from "@/lib/organizer/quiz-play";
import { readGameLook, type GameLook } from "@/lib/organizer/game-look";
import { usePlayCopy } from "@/components/play/usePlayCopy";

type PlayAudience = "anyone" | "event" | "pass";

type PlayGame = {
  name: string;
  description: string;
  type: string;
  typeLabel: string;
  spotCount: number;
  audience: PlayAudience;
  playLimit: "once" | "repeat";
  signedIn: boolean;
  accountNickname: string | null;
  /** 対象イベントに申し込んだアカウントで、ニックネーム・合言葉なしで参加できる。 */
  eventEntry: boolean;
  start: PlayStart | null;
  moment: PublicPlayMoment | null;
  quiz: PublicQuiz | null;
  mission: PublicMissionPlay | null;
  photo: PublicPhotoPlay | null;
  coupon: PublicCouponPlay | null;
  checkin: PublicCheckinPlay | null;
  mystery: PublicMysteryPlay | null;
  /** 参加画面のアイコンと背景（スタンプラリー以外）。 */
  look: GameLook | null;
};

function isHowtoIcon(value: string): value is GameHowtoIcon {
  return (GAME_HOWTO_ICONS as readonly string[]).includes(value);
}

function readStart(raw: unknown): PlayStart | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const steps = Array.isArray(row.steps)
    ? row.steps.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const step = item as Record<string, unknown>;
        const label = typeof step.label === "string" ? step.label.trim() : "";
        const icon = typeof step.icon === "string" && isHowtoIcon(step.icon) ? step.icon : "pin";
        return label ? [{ icon, label }] : [];
      })
    : [];
  return {
    configured: row.configured === true,
    title: typeof row.title === "string" ? row.title : "",
    catchCopy: typeof row.catchCopy === "string" ? row.catchCopy : "",
    description: typeof row.description === "string" ? row.description : "",
    imageUrl: safeImageUrl(row.imageUrl),
    videoUrl: safeImageUrl(row.videoUrl),
    steps: steps.slice(0, 5),
    buttonLabel: typeof row.buttonLabel === "string" && row.buttonLabel.trim() ? row.buttonLabel : "ラリーをはじめる",
    showCharacter: row.showCharacter === true,
    showFreeBadge: row.showFreeBadge === true,
    showPeriod: row.showPeriod === true,
    showShare: row.showShare === true,
    look: row.look && typeof row.look === "object" ? (row.look as PlayStart["look"]) : undefined,
    extraImages: sanitizeStartImages(row.extraImages),
    extraShapes: sanitizeStartShapes(row.extraShapes),
    extraTexts: Array.isArray(row.extraTexts)
      ? row.extraTexts.flatMap((item): NonNullable<PlayStart["extraTexts"]> => {
          if (!item || typeof item !== "object") return [];
          const t = item as Record<string, unknown>;
          if (typeof t.text !== "string" || !t.text.trim()) return [];
          return [
            {
              id: typeof t.id === "string" ? t.id : String(t.text).slice(0, 8),
              text: t.text,
              size: t.size === "s" || t.size === "l" ? t.size : "m",
              bold: t.bold === true,
              color: t.color === "#fff4d6" || t.color === "#1d2a22" ? t.color : "#ffffff",
            },
          ];
        })
      : undefined,
    periodLabel: typeof row.periodLabel === "string" && row.periodLabel.trim() ? row.periodLabel : null,
  };
}

export function PlayJoinClient() {
  const params = useParams();
  const router = useRouter();
  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : typeof tokenParam === "string" ? tokenParam : "";

  const [game, setGame] = useState<PlayGame | null>(null);
  const [progress, setProgress] = useState<PlayProgress | null>(null);
  const [highlightSpotId, setHighlightSpotId] = useState<string | null>(null);
  const [stampMessage, setStampMessage] = useState<{ name: string; already: boolean } | null>(null);
  const [stampMoment, setStampMoment] = useState<PublicPlayMoment | null>(null);
  const [stampEvent, setStampEvent] = useState<RallyStampEvent | null>(null);
  const [nickname, setNickname] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSpot, setPendingSpot] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const copy = usePlayCopy();
  useWatchCouponUse(token, progress, setProgress);

  useEffect(() => {
    if (!token) {
      setError("ゲームが見つかりません");
      setLoading(false);
      return;
    }
    const search = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const spotFromUrl = search?.get("spot") ?? "";
    // スポット画面でキーワードやGPSで押したあと、獲得演出を出すために戻ってくる。
    const gotSpotId = search?.get("got") ?? "";
    const gotAgain = search?.get("again") === "1";
    setPendingSpot(spotFromUrl);
    let cancelled = false;

    (async () => {
      try {
        const gameRes = await fetch(`/api/play/${encodeURIComponent(token)}`, { cache: "no-store" });
        const gameJson = await gameRes.json();
        if (!gameRes.ok) {
          if (!cancelled) setError(gameJson.error ?? "ゲームが見つかりません");
          return;
        }
        if (!cancelled) {
          const body = gameJson as PlayGame & { start?: unknown };
          const knownNickname =
            typeof body.accountNickname === "string" ? body.accountNickname.trim() : "";
          setGame({
            name: body.name,
            description: body.description ?? "",
            type: body.type ?? "stamp",
            typeLabel: body.typeLabel,
            spotCount: body.spotCount ?? 0,
            audience: body.audience === "event" || body.audience === "pass" ? body.audience : "anyone",
            playLimit: body.playLimit === "repeat" ? "repeat" : "once",
            signedIn: body.signedIn === true,
            accountNickname: knownNickname || null,
            eventEntry: (body as { eventEntry?: unknown }).eventEntry === true,
            start: readStart(body.start),
            moment: readPublicPlayMoment(body.moment),
            quiz: readPublicQuiz(body.quiz),
            look: body.look ? readGameLook(body.look) : null,
            mission: readPublicMission(body.mission),
            photo: readPublicPhoto(body.photo),
            coupon: readPublicCoupon(body.coupon),
            checkin: readPublicCheckin(body.checkin),
            mystery: readPublicMystery(body.mystery),
          });
          if (knownNickname) setNickname((current) => current || knownNickname);
        }

        const stored = readPlaySession(token);
        if (!stored) return;
        const resumeRes = await fetch(`/api/play/${encodeURIComponent(token)}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: stored.deviceToken }),
        });
        if (!resumeRes.ok) {
          const resumeJson = (await resumeRes.json().catch(() => ({}))) as { error?: string; code?: string | null };
          clearPlaySession(token);
          if (!cancelled && typeof resumeJson.code === "string" && resumeJson.code.startsWith("audience_")) {
            setError(resumeJson.error ?? "このラリーには入れません");
            setNeedsLogin(resumeJson.code === "audience_login" || resumeJson.code === "account_login");
            setShowJoin(true);
          }
          return;
        }
        const session = (await resumeRes.json()) as PlaySession;
        if (cancelled) return;
        writePlaySession(token, { deviceToken: session.deviceToken, nickname: session.progress.nickname });
        setProgress(session.progress);
        if (spotFromUrl) {
          await stampPendingSpot(token, session.deviceToken, spotFromUrl, cancelled);
        } else if (gotSpotId) {
          const got = session.progress.spots.find((spot) => spot.id === gotSpotId);
          if (got?.stamped) {
            setStampEvent({ spotId: got.id, name: got.name, already: gotAgain });
            setHighlightSpotId(got.id);
          }
          router.replace(`/play/${token}`);
        }
      } catch {
        if (!cancelled) setError("読み込みに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // 通常画面の「ゲームに戻る」に出す名前と進捗を残す。進捗が動いたときだけ時刻を進める。
  const playTitle = game ? game.start?.title.trim() || game.name : "";
  useEffect(() => {
    if (!token || !progress || !playTitle) return;
    const stored = readPlaySession(token);
    if (!stored) return;
    const moved =
      stored.title !== playTitle ||
      stored.stampedCount !== progress.stampedCount ||
      stored.spotCount !== progress.spotCount ||
      stored.completed !== progress.completed;
    if (!moved) return;
    writePlaySession(token, {
      title: playTitle,
      stampedCount: progress.stampedCount,
      spotCount: progress.spotCount,
      completed: progress.completed,
      updatedAt: Date.now(),
    });
  }, [token, progress, playTitle]);

  async function stampPendingSpot(
    joinToken: string,
    deviceToken: string,
    spotToken: string,
    cancelled: boolean
  ) {
    try {
      const res = await fetch(`/api/play/spot/${encodeURIComponent(spotToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken }),
      });
      const json = (await res.json()) as PlayStampResult & {
        error?: string;
        moment?: unknown;
        code?: string | null;
      };
      if (cancelled) return;
      if (
        res.status === 422 &&
        (json.code === "keyword_required" ||
          json.code === "keyword_mismatch" ||
          json.code === "gps_required" ||
          json.code === "gps_far")
      ) {
        router.replace(`/play/spot/${encodeURIComponent(spotToken)}`);
        return;
      }
      if (!res.ok) return;
      setStampMoment(readPublicPlayMoment(json.moment));
      setProgress(json.progress);
      setStampMessage({ name: json.spotName, already: json.alreadyStamped });
      setStampEvent({ spotId: json.spotId ?? null, name: json.spotName, already: json.alreadyStamped });
      setHighlightSpotId(json.spotId ?? null);
      router.replace(`/play/${joinToken}`);
    } catch {
      /* 参加は継続 */
    }
  }

  async function replay() {
    if (!window.confirm(copy.replayConfirm)) return;
    const stored = readPlaySession(token);
    if (!stored) return;
    setReplaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: stored.deviceToken }),
      });
      const json = (await res.json()) as PlaySession & { error?: string; code?: string | null };
      if (!res.ok || !json.progress) {
        setNeedsLogin(json.code === "audience_login" || json.code === "account_login");
        setError(json.error ?? "もう一周できませんでした");
        return;
      }
      setNeedsLogin(false);
      setProgress(json.progress);
      setStampMessage(null);
      setStampEvent(null);
      setStampMoment(null);
      setHighlightSpotId(null);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setReplaying(false);
    }
  }

  async function shareStart() {
    if (!token) return;
    const url = `${window.location.origin}/play/${token}`;
    const title = game?.start?.title.trim() || game?.name || copy.msg("スタンプラリー");
    const text = game?.start?.catchCopy.trim() || game?.start?.description.trim() || title;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareNote("リンクをコピーしました");
    } catch {
      setShareNote("共有できませんでした");
    }
  }

  /** 対象イベントに申し込んだアカウントで参加する（ニックネーム・合言葉なし）。 */
  async function handleEntry() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/entry`, { method: "POST" });
      const json = (await res.json()) as PlaySession & { error?: string; code?: string | null };
      if (!res.ok) {
        setError(json.error ?? "参加できませんでした");
        setNeedsLogin(json.code === "audience_login");
        return;
      }
      setNeedsLogin(false);
      writePlaySession(token, { deviceToken: json.deviceToken, nickname: json.progress.nickname });
      setProgress(json.progress);
      if (pendingSpot) {
        await stampPendingSpot(token, json.deviceToken, pendingSpot, false);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, passphrase }),
      });
      const json = (await res.json()) as PlaySession & { error?: string; code?: string | null };
      if (!res.ok) {
        setError(json.error ?? "参加できませんでした");
        setNeedsLogin(json.code === "audience_login" || json.code === "account_login");
        return;
      }
      setNeedsLogin(false);
      writePlaySession(token, { deviceToken: json.deviceToken, nickname: json.progress.nickname });
      setProgress(json.progress);
      if (pendingSpot) {
        await stampPendingSpot(token, json.deviceToken, pendingSpot, false);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (error && !game) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <h1>{copy.gameMissing}</h1>
          <p>{copy.msg(error)}</p>
        </div>
      </main>
    );
  }

  if (loading || !game) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p>{copy.loading}</p>
        </div>
      </main>
    );
  }

  const start = game.start;
  const showStart = game.type === "stamp" && !progress && !showJoin;
  // アイコンと背景は、スタンプラリー以外で変えられる。
  const look = game.type === "stamp" ? null : game.look;

  if (progress && game.type === "quiz" && game.quiz) {
    return (
      <main className={`play-game ${gameLookClass(look)} play-game--scene`}>
        <GameLookBackdrop look={look} />
        {progress.completed ? (
          <GameSceneBand look={look} scene="clear" />
        ) : (
          <GameSceneBand look={look} scene="play" progress={gamePlayProgress(progress)} />
        )}
        <div className="play-game__card">
          <PlayLookHead
            look={look}
            screen={progress.completed ? "clear" : "play"}
            kicker={<p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>}
            title={<h1>{game.name}</h1>}
            meta={<p className="play-game__meta">{progress.nickname}</p>}
          />
          <ClearLayer look={look} enabled screen={progress.completed ? "clear" : "play"}>
            <PlayQuiz token={token} quiz={game.quiz} progress={progress} onProgress={setProgress} />
          </ClearLayer>
        </div>
      </main>
    );
  }

  if (progress && game.type === "mission" && game.mission) {
    return (
      <main className={`play-game ${gameLookClass(look)} play-game--scene`}>
        <GameLookBackdrop look={look} />
        {progress.completed ? (
          <GameSceneBand look={look} scene="clear" />
        ) : (
          <GameSceneBand look={look} scene="play" progress={gamePlayProgress(progress)} />
        )}
        <div className="play-game__card">
          <PlayLookHead
            look={look}
            screen={progress.completed ? "clear" : "play"}
            kicker={<p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>}
            title={<h1>{game.name}</h1>}
            meta={<p className="play-game__meta">{progress.nickname}</p>}
          />
          <ClearLayer look={look} enabled screen={progress.completed ? "clear" : "play"}>
            <PlayMission token={token} mission={game.mission} progress={progress} onProgress={setProgress} />
          </ClearLayer>
        </div>
      </main>
    );
  }

  if (progress && game.type === "photo" && game.photo) {
    return (
      <main className={`play-game ${gameLookClass(look)} play-game--scene`}>
        <GameLookBackdrop look={look} />
        {progress.completed ? (
          <GameSceneBand look={look} scene="clear" />
        ) : (
          <GameSceneBand look={look} scene="play" progress={gamePlayProgress(progress)} />
        )}
        <div className="play-game__card">
          <PlayLookHead
            look={look}
            screen={progress.completed ? "clear" : "play"}
            kicker={<p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>}
            title={<h1>{game.name}</h1>}
            meta={<p className="play-game__meta">{progress.nickname}</p>}
          />
          <ClearLayer look={look} enabled screen={progress.completed ? "clear" : "play"}>
            <PlayPhoto token={token} photo={game.photo} progress={progress} onProgress={setProgress} />
          </ClearLayer>
        </div>
      </main>
    );
  }

  if (progress && game.type === "coupon" && game.coupon) {
    return (
      <main className={`play-game ${gameLookClass(look)} play-game--scene`}>
        <GameLookBackdrop look={look} />
        {progress.completed ? (
          <GameSceneBand look={look} scene="clear" />
        ) : (
          <GameSceneBand look={look} scene="play" progress={gamePlayProgress(progress)} />
        )}
        <div className="play-game__card">
          <PlayLookHead
            look={look}
            screen={progress.completed ? "clear" : "play"}
            kicker={<p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>}
            title={<h1>{game.name}</h1>}
            meta={<p className="play-game__meta">{progress.nickname}</p>}
          />
          <ClearLayer look={look} enabled screen={progress.completed ? "clear" : "play"}>
            <PlayCoupon token={token} coupon={game.coupon} progress={progress} onProgress={setProgress} />
          </ClearLayer>
        </div>
      </main>
    );
  }

  if (progress && game.type === "checkin" && game.checkin) {
    return (
      <main className={`play-game ${gameLookClass(look)} play-game--scene`}>
        <GameLookBackdrop look={look} />
        {progress.completed ? (
          <GameSceneBand look={look} scene="clear" />
        ) : (
          <GameSceneBand look={look} scene="play" progress={gamePlayProgress(progress)} />
        )}
        <div className="play-game__card">
          <PlayLookHead
            look={look}
            screen={progress.completed ? "clear" : "play"}
            kicker={<p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>}
            title={<h1>{game.name}</h1>}
            meta={<p className="play-game__meta">{progress.nickname}</p>}
          />
          <ClearLayer look={look} enabled screen={progress.completed ? "clear" : "play"}>
            <PlayCheckin token={token} checkin={game.checkin} progress={progress} onProgress={setProgress} />
          </ClearLayer>
        </div>
      </main>
    );
  }

  if (progress && game.type === "mystery" && game.mystery) {
    return (
      <main className={`play-game ${gameLookClass(look)} play-game--scene`}>
        <GameLookBackdrop look={look} />
        {progress.completed ? (
          <GameSceneBand look={look} scene="clear" />
        ) : (
          <GameSceneBand look={look} scene="play" progress={gamePlayProgress(progress)} />
        )}
        <div className="play-game__card">
          <PlayLookHead
            look={look}
            screen={progress.completed ? "clear" : "play"}
            kicker={<p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>}
            title={<h1>{game.name}</h1>}
            meta={<p className="play-game__meta">{progress.nickname}</p>}
          />
          <ClearLayer look={look} enabled screen={progress.completed ? "clear" : "play"}>
            <PlayMystery token={token} mystery={game.mystery} progress={progress} onProgress={setProgress} />
          </ClearLayer>
        </div>
      </main>
    );
  }
  const shownMoment = stampMoment?.configured ? stampMoment : game.moment;
  const loginRequired = game.playLimit === "once" || game.audience !== "anyone";
  const loginHref = `/auth?next=${encodeURIComponent(`/play/${token}`)}`;

  if (showStart) {
    return (
      <RallyStartScreen
        start={start}
        title={start?.title.trim() || game.name}
        fallbackDescription={game.description}
        showLogin={loginRequired && !game.signedIn}
        loginHref={loginHref}
        shareNote={shareNote}
        onShare={() => void shareStart()}
        onStart={() => setShowJoin(true)}
      />
    );
  }

  if (progress && game.type === "stamp") {
    return (
      <RallyApp
        favoritesKey={`mg-play-fav:${token}`}
        title={start?.title.trim() || game.name}
        heroImageUrl={start?.imageUrl ?? ""}
        progress={progress}
        moment={shownMoment}
        stampEvent={stampEvent}
        onStampEventSeen={() => setStampEvent(null)}
        claimHref={loginHref}
        loginHref={loginHref}
        showLogin={needsLogin || (loginRequired && !game.signedIn)}
        replaying={replaying}
        replayError={error}
        onReplay={() => void replay()}
      />
    );
  }

  // スタンプラリー以外の参加画面（スタート）にも、光の線の演出を出す。
  const startScene = game.type !== "stamp";
  return (
    <main className={`play-game ${gameLookClass(look)}${startScene ? " play-game--scene" : ""}`}>
      <GameLookBackdrop look={look} />
      {startScene ? <GameSceneBand look={look} scene="start" /> : null}
      <div className="play-game__card">
        <GameStartHeader
          look={look}
          parts={{
            icon: <GameLookIconMark look={look} />,
            kicker: <p className="play-game__kicker">{game.typeLabel}</p>,
            title: <h1>{game.name}</h1>,
            desc: game.description ? <p className="play-game__desc">{game.description}</p> : null,
            meta: (
              <p className="play-game__meta">
                {game.type === "quiz" && game.quiz
                  ? copy.quizMeta(game.quiz.questions.length, game.quiz.clearCount)
                  : game.type === "mission" && game.mission
                    ? copy.missionMeta(game.mission.missions.length, game.mission.clearCount)
                    : game.type === "photo" && game.photo
                      ? copy.photoMeta(game.photo.spots.length, game.photo.clearCount)
                      : game.type === "coupon" && game.coupon
                        ? copy.couponMeta(game.coupon.stores.length, game.coupon.needed)
                        : game.type === "checkin" && game.checkin
                          ? copy.checkinMeta(game.checkin.spots.length, game.checkin.needed)
                          : game.type === "mystery" && game.mystery
                            ? copy.mysteryMeta(game.mystery.steps.length, game.mystery.needed)
                            : game.spotCount > 0
                      ? copy.spotMeta(game.spotCount)
                      : copy.spotsPreparing}
              </p>
            ),
          }}
          renderForm={
            progress
              ? undefined
              : ({ fields, dock }) => (
                  <form className="play-join" onSubmit={(e) => void handleJoin(e)}>
                    {fields(
                      <>
                        {game.eventEntry ? (
                          <div style={{ display: "grid", gap: "0.4rem", marginBottom: "0.4rem" }}>
                            <button
                              type="button"
                              className="play-dock__go"
                              disabled={saving}
                              onClick={() => void handleEntry()}
                              style={{ width: "100%" }}
                            >
                              {copy.msg("イベントの申し込みで参加する")}
                            </button>
                            <small style={{ fontSize: "0.74rem", color: "#5d6b62", lineHeight: 1.5 }}>
                              {copy.msg("対象イベントに申し込み済みのアカウントなので、ニックネームと合言葉は要りません。")}
                            </small>
                            <p style={{ margin: "0.3rem 0 0", textAlign: "center", fontSize: "0.72rem", color: "#8a968e" }}>
                              {copy.msg("または、ニックネームと合言葉で参加")}
                            </p>
                          </div>
                        ) : null}
                        <p className="play-join__lead">{pendingSpot ? copy.joinBeforeStamp : copy.joinWithWords}</p>
                        {game.playLimit === "once" ? (
                          <p className="play-join__audience">
                            {game.signedIn
                              ? game.accountNickname
                                ? copy.accountPlaying(game.accountNickname)
                                : copy.signedInOnce
                              : copy.onceNeedsLogin}
                          </p>
                        ) : null}
                        {game.audience === "event" ? (
                          <p className="play-join__audience">{game.signedIn ? copy.checkingEvent : copy.eventAccount}</p>
                        ) : null}
                        {game.audience === "pass" ? (
                          <p className="play-join__audience">{game.signedIn ? copy.checkingPass : copy.passAccount}</p>
                        ) : null}
                        <label>
                          {copy.nickname}
                          <input
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={PLAY_NICKNAME_MAX}
                            autoComplete="nickname"
                            required
                          />
                        </label>
                        <label>
                          {copy.passphrase}
                          <span className="play-join__secret">
                            <input
                              type={showPassphrase ? "text" : "password"}
                              value={passphrase}
                              onChange={(e) => setPassphrase(e.target.value)}
                              minLength={PLAY_PASSPHRASE_MIN}
                              maxLength={PLAY_PASSPHRASE_MAX}
                              autoComplete="off"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassphrase((current) => !current)}
                              aria-pressed={showPassphrase}
                            >
                              {showPassphrase ? copy.hideSecret : copy.showSecret}
                            </button>
                          </span>
                        </label>
                        {error ? <p className="play-join__error">{copy.msg(error)}</p> : null}
                      </>,
                    )}
                    <div
                      className={`${dock.className}${
                        (needsLogin || (loginRequired && !game.signedIn)) && game.type === "stamp"
                          ? " play-dock--trio"
                          : needsLogin || (loginRequired && !game.signedIn) || game.type === "stamp"
                            ? " play-dock--pair"
                            : ""
                      }`}
                      style={dock.style}
                      onPointerDown={dock.onPointerDown}
                    >
                      {needsLogin || (loginRequired && !game.signedIn) ? (
                        <Link className="play-dock__link" href={loginHref}>
                          {copy.login}
                        </Link>
                      ) : null}
                      <button type="submit" className="play-dock__go" disabled={saving}>
                        {saving ? copy.joining : copy.join}
                      </button>
                      {game.type === "stamp" ? (
                        <button type="button" className="play-dock__ghost" onClick={() => setShowJoin(false)}>
                          {copy.backToStart}
                        </button>
                      ) : null}
                    </div>
                  </form>
                )
          }
        />

        {progress ? (
          <>
            {progress.canReplay ? (
              <button type="button" className="play-clear__replay" disabled={replaying} onClick={() => void replay()}>
                {replaying ? copy.replaying : copy.replay}
              </button>
            ) : null}
            {error && progress?.canReplay ? <p className="play-clear__replay-note">{copy.msg(error)}</p> : null}
            {needsLogin && progress?.canReplay ? (
              <Link className="play-join__login" href={loginHref}>
                {copy.login}
              </Link>
            ) : null}
            <PlayProgressCard
              progress={progress}
              highlightSpotId={highlightSpotId}
              justStampedName={stampMessage?.name}
              alreadyStamped={stampMessage?.already}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}

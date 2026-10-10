"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Flag, Gift, MapPin, QrCode, Stamp, type LucideIcon } from "lucide-react";
import { PlayClearPanel, PlaySpotCopy, PlayStampBurst, playMomentHasClear } from "@/components/play/PlayMoment";
import { PlayMission } from "@/components/play/PlayMission";
import { PlayMystery } from "@/components/play/PlayMystery";
import { PlayCheckin } from "@/components/play/PlayCheckin";
import { PlayCoupon } from "@/components/play/PlayCoupon";
import { PlayPhoto } from "@/components/play/PlayPhoto";
import { PlayQuiz } from "@/components/play/PlayQuiz";
import { PlaySpotPlace } from "@/components/play/PlaySpotPlace";
import { PlayProgressCard } from "@/components/play/PlayProgressCard";
import {
  GAME_HOWTO_ICONS,
  readPublicPlayMoment,
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
import { usePlayCopy } from "@/components/play/usePlayCopy";

const HOWTO_ICONS: Record<GameHowtoIcon, LucideIcon> = {
  pin: MapPin,
  qr: QrCode,
  stamp: Stamp,
  gift: Gift,
  flag: Flag,
};

type PlayStartStep = {
  icon: GameHowtoIcon;
  label: string;
};

type PlayStart = {
  configured: boolean;
  title: string;
  catchCopy: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  steps: PlayStartStep[];
  buttonLabel: string;
  showCharacter: boolean;
  showFreeBadge: boolean;
  showPeriod: boolean;
  showShare: boolean;
  periodLabel: string | null;
};

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
  start: PlayStart | null;
  moment: PublicPlayMoment | null;
  quiz: PublicQuiz | null;
  mission: PublicMissionPlay | null;
  photo: PublicPhotoPlay | null;
  coupon: PublicCouponPlay | null;
  checkin: PublicCheckinPlay | null;
  mystery: PublicMysteryPlay | null;
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
    const spotFromUrl =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("spot") ?? "" : "";
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
            start: readStart(body.start),
            moment: readPublicPlayMoment(body.moment),
            quiz: readPublicQuiz(body.quiz),
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

  if (progress && game.type === "quiz" && game.quiz) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>
          <h1>{game.name}</h1>
          <p className="play-game__meta">{progress.nickname}</p>
          <PlayQuiz token={token} quiz={game.quiz} progress={progress} onProgress={setProgress} />
        </div>
      </main>
    );
  }

  if (progress && game.type === "mission" && game.mission) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>
          <h1>{game.name}</h1>
          <p className="play-game__meta">{progress.nickname}</p>
          <PlayMission token={token} mission={game.mission} progress={progress} onProgress={setProgress} />
        </div>
      </main>
    );
  }

  if (progress && game.type === "photo" && game.photo) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>
          <h1>{game.name}</h1>
          <p className="play-game__meta">{progress.nickname}</p>
          <PlayPhoto token={token} photo={game.photo} progress={progress} onProgress={setProgress} />
        </div>
      </main>
    );
  }

  if (progress && game.type === "coupon" && game.coupon) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>
          <h1>{game.name}</h1>
          <p className="play-game__meta">{progress.nickname}</p>
          <PlayCoupon token={token} coupon={game.coupon} progress={progress} onProgress={setProgress} />
        </div>
      </main>
    );
  }

  if (progress && game.type === "checkin" && game.checkin) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>
          <h1>{game.name}</h1>
          <p className="play-game__meta">{progress.nickname}</p>
          <PlayCheckin token={token} checkin={game.checkin} progress={progress} onProgress={setProgress} />
        </div>
      </main>
    );
  }

  if (progress && game.type === "mystery" && game.mystery) {
    return (
      <main className="play-game">
        <div className="play-game__card">
          <p className="play-game__kicker">{copy.msg(game.typeLabel)}</p>
          <h1>{game.name}</h1>
          <p className="play-game__meta">{progress.nickname}</p>
          <PlayMystery token={token} mystery={game.mystery} progress={progress} onProgress={setProgress} />
        </div>
      </main>
    );
  }
  const shownMoment = stampMoment?.configured ? stampMoment : game.moment;
  const loginRequired = game.playLimit === "once" || game.audience !== "anyone";
  const loginHref = `/auth?next=${encodeURIComponent(`/play/${token}`)}`;

  if (showStart) {
    const title = start?.title.trim() || game.name;
    const buttonLabel = start?.buttonLabel.trim() || "ラリーをはじめる";
    return (
      <main className="play-game">
        <div className="play-game__card play-start">
          {start?.videoUrl ? (
            <video className="play-start__video" src={start.videoUrl} controls playsInline preload="metadata" />
          ) : null}
          {start?.imageUrl ? <img className="play-start__photo" src={start.imageUrl} alt="" /> : null}
          {start?.showFreeBadge ? <p className="play-start__badge">{copy.freeToJoin}</p> : null}
          {start?.showCharacter ? (
            <Image
              className="play-start__character"
              src="/organizer/games/loading-mascot-1.png"
              alt=""
              width={72}
              height={72}
            />
          ) : null}
          <h1>{title}</h1>
          {start?.catchCopy ? <p className="play-start__catch">{start.catchCopy}</p> : null}
          {start?.description ? <p className="play-game__desc">{start.description}</p> : null}
          {start && start.steps.length > 0 ? (
            <ol className="play-start__steps">
              {start.steps.map((step, index) => {
                const Icon = HOWTO_ICONS[step.icon];
                return (
                  <li key={`${step.icon}-${index}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                    <span>
                      {index + 1}. {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : null}
          {start?.periodLabel ? <p className="play-game__meta">{copy.msg(start.periodLabel)}</p> : null}
          {start?.showShare ? (
            <button type="button" className="play-start__share" onClick={() => void shareStart()}>
              {copy.share}
            </button>
          ) : null}
          {shareNote ? (
            <p className="play-start__note" role="status">
              {copy.msg(shareNote)}
            </p>
          ) : null}
          <div className={loginRequired && !game.signedIn ? "play-dock play-dock--pair" : "play-dock"}>
            {loginRequired && !game.signedIn ? (
              <Link className="play-dock__link" href={loginHref}>
                {copy.login}
              </Link>
            ) : null}
            <button type="button" className="play-dock__go" onClick={() => setShowJoin(true)}>
              {copy.msg(buttonLabel)}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="play-game">
      <div className="play-game__card">
        <span className="play-game__icon" aria-hidden>
          <Stamp className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <p className="play-game__kicker">{game.typeLabel}</p>
        <h1>{game.name}</h1>
        {game.description ? <p className="play-game__desc">{game.description}</p> : null}
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

        {progress ? (
          <>
            {game.type === "stamp" && shownMoment && stampMessage ? (
              <PlaySpotCopy
                intro={shownMoment.intro}
                description={shownMoment.description}
                hint={shownMoment.hint}
                imageUrl={shownMoment.imageUrl}
                videoUrl={shownMoment.videoUrl}
                imageAlt={stampMessage.name}
              />
            ) : null}
            {game.type === "stamp" && shownMoment && stampMessage ? (
              <PlaySpotPlace lat={shownMoment.lat} lng={shownMoment.lng} name={stampMessage.name} />
            ) : null}
            {game.type === "stamp" && shownMoment && stampMessage ? (
              <PlayStampBurst
                message={shownMoment.stampMessage}
                animation={shownMoment.stampAnimation}
                already={stampMessage.already}
                imageUrl={shownMoment.stampImageUrl}
                sound={shownMoment.stampSound}
                soundUrl={shownMoment.stampSoundUrl}
              />
            ) : null}
            {game.type === "stamp" && progress.completed && shownMoment ? (
              <PlayClearPanel
                moment={shownMoment}
                code={progress.rewardCode}
                used={progress.rewardUsed}
                points={progress.rewardPoints}
                pointsAwarded={progress.rewardPointsAwarded}
                badge={progress.rewardBadge}
                badgeAwarded={progress.rewardBadgeAwarded}
                badgeImage={progress.rewardBadgeImage}
                claimHref={`/auth?next=${encodeURIComponent(`/play/${token}`)}`}
              />
            ) : null}
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
              quietToast={
                game.type === "stamp" && Boolean(stampMessage && !stampMessage.already && shownMoment?.stampMessage)
              }
              quietDone={
                game.type === "stamp" &&
                (playMomentHasClear(shownMoment) ||
                  Boolean(progress.rewardCode) ||
                  Boolean(progress.rewardUsed) ||
                  Boolean(progress.rewardPoints) ||
                  Boolean(progress.rewardBadge))
              }
              asCard={game.type === "stamp"}
            />
          </>
        ) : (
          <form className="play-join" onSubmit={(e) => void handleJoin(e)}>
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
            <div
              className={
                (needsLogin || (loginRequired && !game.signedIn)) && game.type === "stamp"
                  ? "play-dock play-dock--trio"
                  : needsLogin || (loginRequired && !game.signedIn) || game.type === "stamp"
                    ? "play-dock play-dock--pair"
                    : "play-dock"
              }
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
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Stamp } from "lucide-react";
import { PlayLocaleSwitch } from "@/components/play/PlayLocaleSwitch";
import { PlayCheckin } from "@/components/play/PlayCheckin";
import { PlayCoupon } from "@/components/play/PlayCoupon";
import { PlayMission } from "@/components/play/PlayMission";
import { PlayMystery } from "@/components/play/PlayMystery";
import { PlayPhoto } from "@/components/play/PlayPhoto";
import { PlayQuiz } from "@/components/play/PlayQuiz";
import { usePlayCopy } from "@/components/play/usePlayCopy";
import { QuizPreviewEditor, type QuizPreviewEdit } from "@/components/organizer/games/QuizPreviewEditor";
import { publicCheckin, readStoredCheckin } from "@/lib/organizer/checkin-play";
import { sanitizeCheckinSettings } from "@/lib/organizer/checkin";
import { readStoredCoupon } from "@/lib/organizer/coupon-play";
import { sanitizeCouponSettings } from "@/lib/organizer/coupon";
import { publicMission, readStoredMission } from "@/lib/organizer/mission-play";
import { sanitizeMissionSettings } from "@/lib/organizer/mission";
import { publicMystery, readStoredMystery } from "@/lib/organizer/mystery-play";
import { sanitizeMysterySettings } from "@/lib/organizer/mystery";
import { readStoredPhoto } from "@/lib/organizer/photo-play";
import { sanitizePhotoSettings } from "@/lib/organizer/photo";
import { publicQuiz, readStoredQuiz } from "@/lib/organizer/quiz-play";
import type { PlayProgress } from "@/lib/organizer/play-types";
import { cn } from "@/lib/utils";
import "./wizard-preview.css";

/** iPhone 14/15 の画面（CSS ピクセル）と、枠の太さ。スタンプラリーのプレビューと同じ。 */
const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;
const PHONE_W = SCREEN_W + BEZEL * 2;
const PHONE_H = SCREEN_H + BEZEL * 2;

export type GamePreviewKind = "quiz" | "mission" | "photo" | "coupon" | "checkin" | "mystery";
export type GamePreviewView = "start" | "play" | "clear";

const VIEWS: { id: GamePreviewView; label: string }[] = [
  { id: "start", label: "参加" },
  { id: "play", label: "プレイ中" },
  { id: "clear", label: "クリア" },
];

/** 見本の進み具合。プレイ中は focus の手前まで（なければ半分）済み、クリアは全部済み。 */
function sampleDone(total: number, view: GamePreviewView, focus?: number): number[] {
  if (view === "start") return [];
  if (view === "clear") return Array.from({ length: total }, (_, index) => index);
  const upto = focus != null ? Math.min(Math.max(focus, 0), Math.max(total - 1, 0)) : Math.floor(total / 2);
  return Array.from({ length: upto }, (_, index) => index);
}

type Built = { total: number; meta: string; screen: (progress: PlayProgress | null) => ReactNode; progress: PlayProgress };

const noop = () => undefined;
const TOKEN = "organizer-preview";

/**
 * スタンプラリー以外のゲームの、参加者が実際に見る画面をスマホ枠の中に出す。
 * 保存するときと同じ設定から、参加画面と同じ部品で描く。
 */
export function GamePhonePreview({
  kind,
  typeLabel,
  name,
  description,
  settings,
  focus,
  stepView,
  edit,
}: {
  /** 渡すと、プレビューの上で直接書き換えられる（いまはクイズ）。 */
  edit?: {
    onName: (value: string) => void;
    onDescription: (value: string) => void;
    quiz?: QuizPreviewEdit;
  };
  kind: GamePreviewKind;
  typeLabel: string;
  name: string;
  description: string;
  /** 保存のときに送る、種類ごとの設定（例：クイズなら body.quiz）。 */
  settings: unknown;
  /** プレイ中に見せる問題・項目の番号。 */
  focus?: number;
  /** 作成中のステップに合わせて見せる画面。 */
  stepView?: GamePreviewView;
}) {
  const copy = usePlayCopy();
  const [view, setView] = useState<GamePreviewView>(stepView ?? "start");
  useEffect(() => {
    if (stepView) setView(stepView);
  }, [stepView]);
  // 問題を選び直したら、その問題を見せる（最初の表示では変えない）。
  const lastFocus = useRef(focus);
  useEffect(() => {
    if (focus == null || focus === lastFocus.current) return;
    lastFocus.current = focus;
    setView("play");
  }, [focus]);

  const built: Built | null = useMemo(() => {
    const base = (total: number, done: number[]): PlayProgress => ({
      nickname: "プレビュー",
      stampedCount: done.length,
      spotCount: total,
      completed: false,
      spots: [],
    });
    if (kind === "quiz") {
      const stored = readStoredQuiz({ quiz: settings });
      if (!stored) return null;
      const quiz = publicQuiz(stored);
      const total = stored.questions.length;
      const done = sampleDone(total, view, focus);
      const completed = done.length >= stored.clearCount;
      return {
        total,
        meta: copy.quizMeta(total, stored.clearCount),
        progress: {
          ...base(total, done),
          completed,
          rewardCode: completed && stored.couponOn ? "MG-0000" : undefined,
          quizRank: completed && stored.rankingOn ? 1 : undefined,
          quiz: { needed: stored.clearCount, solved: done, rewards: stored.rewards },
        },
        screen: (progress) =>
          progress ? <PlayQuiz key={view} token={TOKEN} quiz={quiz} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "mission") {
      const clean = sanitizeMissionSettings(settings);
      const stored = clean ? readStoredMission({ mission: clean }) : null;
      if (!clean || !stored) return null;
      const mission = publicMission(stored, clean.publish.hints);
      const total = stored.missions.length;
      const done = sampleDone(total, view, focus);
      const completed = done.length >= stored.clearCount;
      const points = stored.pointsOn
        ? stored.missions.filter((item) => done.includes(item.index)).reduce((sum, item) => sum + item.pointAmount, 0)
        : 0;
      return {
        total,
        meta: copy.missionMeta(total, stored.clearCount),
        progress: {
          ...base(total, done),
          completed,
          rewardPoints: completed && points > 0 ? points : undefined,
          mission: { needed: stored.clearCount, done, rewards: stored.rewards },
        },
        screen: (progress) =>
          progress ? <PlayMission key={view} token={TOKEN} mission={mission} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "photo") {
      const clean = sanitizePhotoSettings(settings);
      const photo = clean ? readStoredPhoto({ photo: clean }) : null;
      if (!photo) return null;
      const total = photo.spots.length;
      const done = sampleDone(total, view, focus);
      const completed = done.length >= photo.clearCount;
      return {
        total,
        meta: copy.photoMeta(total, photo.clearCount),
        progress: {
          ...base(total, done),
          completed,
          rewardPoints: completed && photo.pointAmount > 0 ? photo.pointAmount : undefined,
          photo: { needed: photo.clearCount, done, rewards: photo.rewards },
        },
        screen: (progress) =>
          progress ? <PlayPhoto key={view} token={TOKEN} photo={photo} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "coupon") {
      const clean = sanitizeCouponSettings(settings);
      const coupon = clean ? readStoredCoupon({ coupon: clean }) : null;
      if (!coupon) return null;
      const total = coupon.stores.length;
      const done = sampleDone(total, view, focus);
      const completed = done.length >= coupon.needed;
      return {
        total,
        meta: copy.couponMeta(total, coupon.needed),
        progress: {
          ...base(total, done),
          completed,
          rewardCode: completed && coupon.autoGrant ? "MG-0000" : undefined,
          coupon: { needed: coupon.needed, done, autoGrant: coupon.autoGrant, noStack: coupon.noStack },
        },
        screen: (progress) =>
          progress ? <PlayCoupon key={view} token={TOKEN} coupon={coupon} progress={progress} onProgress={noop} /> : null,
      };
    }
    if (kind === "checkin") {
      const clean = sanitizeCheckinSettings(settings);
      const stored = clean ? readStoredCheckin({ checkin: clean }) : null;
      if (!stored) return null;
      const checkin = publicCheckin(stored);
      const total = stored.spots.length;
      const done = sampleDone(total, view, focus);
      const completed = done.length >= stored.needed;
      return {
        total,
        meta: copy.checkinMeta(total, stored.needed),
        progress: {
          ...base(total, done),
          completed,
          rewardPoints: completed && stored.pointAmount > 0 ? stored.pointAmount : undefined,
          checkin: { needed: stored.needed, done, rewards: stored.rewards },
        },
        screen: (progress) =>
          progress ? <PlayCheckin key={view} token={TOKEN} checkin={checkin} progress={progress} onProgress={noop} /> : null,
      };
    }
    const clean = sanitizeMysterySettings(settings);
    const stored = clean ? readStoredMystery({ mystery: clean }) : null;
    if (!stored) return null;
    const mystery = publicMystery(stored);
    const total = stored.steps.length;
    const done = sampleDone(total, view, focus);
    return {
      total,
      meta: copy.mysteryMeta(total, stored.needed),
      progress: {
        ...base(total, done),
        completed: done.length >= stored.needed,
        mystery: { needed: stored.needed, solved: done, rewards: stored.rewards },
      },
      screen: (progress) =>
        progress ? <PlayMystery key={view} token={TOKEN} mystery={mystery} progress={progress} onProgress={noop} /> : null,
    };
  }, [kind, settings, view, focus, copy]);

  // 実機（390×844）の大きさで描き、置き場所に収まるよう縮める。
  const stageRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(0.7);
  const [actual, setActual] = useState(false);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const { width, height } = stage.getBoundingClientRect();
      const next = Math.min(1, (width - 4) / PHONE_W, (height - 4) / PHONE_H);
      if (next > 0) setFitScale(Math.round(next * 100) / 100);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  const scale = actual ? 1 : fitScale;
  const title = name.trim() || typeLabel;

  return (
    <div className={cn("wizard-preview game-phone", edit && "is-editing")}>
      <div className="wizard-preview__views" role="tablist" aria-label="プレビューする画面">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {edit && view !== "clear" ? <p className="wizard-preview__edit-hint">文字はタップして、そのまま書き換えられます</p> : null}
      <div className="wizard-preview__zoom">
        <span>{actual ? "実寸（100%）" : `実寸の${Math.round(scale * 100)}%`}</span>
        <button type="button" onClick={() => setActual((current) => !current)}>
          {actual ? "画面に合わせる" : "実寸で見る"}
        </button>
      </div>
      <div ref={stageRef} className={cn("wizard-preview__stage", actual && "is-actual")}>
        <div className="wizard-preview__fit" style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
          <div
            className="wizard-preview__phone"
            style={{ width: PHONE_W, height: PHONE_H, padding: BEZEL, transform: `scale(${scale})` }}
          >
            <div className="wizard-preview__screen">
              <div className="play-game-shell">
                <PlayLocaleSwitch />
                {view === "play" && edit?.quiz ? (
                  <main className="play-game">
                    <div className="play-game__card">
                      <p className="play-game__kicker">{copy.msg(typeLabel)}</p>
                      <h1>{title}</h1>
                      <p className="play-game__meta">プレビュー</p>
                      <QuizPreviewEditor edit={edit.quiz} />
                    </div>
                  </main>
                ) : view === "start" || !built ? (
                  <main className="play-game">
                    <div className="play-game__card">
                      <span className="play-game__icon" aria-hidden>
                        <Stamp className="h-7 w-7" strokeWidth={1.6} />
                      </span>
                      <p className="play-game__kicker">{typeLabel}</p>
                      {edit ? (
                        <>
                          <h1>
                            <textarea
                              className="quiz-edit__text quiz-edit__title"
                              value={name}
                              placeholder={typeLabel}
                              aria-label="ゲーム名"
                              maxLength={80}
                              rows={1}
                              onChange={(event) => edit.onName(event.target.value)}
                            />
                          </h1>
                          <p className="play-game__desc">
                            <textarea
                              className="quiz-edit__text"
                              value={description}
                              placeholder="説明文を入力"
                              aria-label="説明文"
                              maxLength={200}
                              rows={2}
                              onChange={(event) => edit.onDescription(event.target.value)}
                            />
                          </p>
                        </>
                      ) : (
                        <>
                          <h1>{title}</h1>
                          {description.trim() ? <p className="play-game__desc">{description.trim()}</p> : null}
                        </>
                      )}
                      <p className="play-game__meta">{built ? built.meta : copy.spotsPreparing}</p>
                      <form className="play-join" onSubmit={(event) => event.preventDefault()}>
                        <p className="play-join__lead">{copy.joinWithWords}</p>
                        <label>
                          {copy.nickname}
                          <input readOnly value="" />
                        </label>
                        <label>
                          {copy.passphrase}
                          <span className="play-join__secret">
                            <input type="password" readOnly value="" />
                            <button type="button">{copy.showSecret}</button>
                          </span>
                        </label>
                        <div className="play-dock">
                          <button type="button" className="play-dock__go">
                            {copy.join}
                          </button>
                        </div>
                      </form>
                    </div>
                  </main>
                ) : (
                  <main className="play-game">
                    <div className="play-game__card">
                      <p className="play-game__kicker">{copy.msg(typeLabel)}</p>
                      <h1>{title}</h1>
                      <p className="play-game__meta">{built.progress.nickname}</p>
                      {built.screen(built.progress)}
                    </div>
                  </main>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {!built && !edit?.quiz ? <p className="wizard-preview__note">内容を入れると、プレイ中とクリアの画面も見られます。</p> : null}
    </div>
  );
}

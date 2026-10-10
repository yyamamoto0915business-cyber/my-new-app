"use client";

import { useMemo, useState } from "react";
import { PlayClearPanel, PlaySpotCopy, PlayStampBurst } from "@/components/play/PlayMoment";
import { PlayProgressCard } from "@/components/play/PlayProgressCard";
import {
  anyStartNextId,
  orderedStampBlock,
  publicPlayMoment,
  publicPlayStart,
  rallyKeywordMatches,
  stampRallyCompleted,
  type GameExperience,
} from "@/lib/organizer/game-experience";
import type { OrganizerGameSpotKind } from "@/lib/organizer/game-tokens";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";

type Spot = GameExperience["spots"][number] & {
  name: string;
  kind: OrganizerGameSpotKind;
};

type Props = {
  name: string;
  periodLabel: string | null;
  experience: GameExperience;
  spots: Spot[];
  onClose: () => void;
};

export function StampRallyTestPlay({ name, periodLabel, experience, spots, onClose }: Props) {
  const visible = useMemo(
    () =>
      spots
        .map((spot, index) => ({ ...spot, id: `test-${index}`, sourceIndex: index }))
        .filter((spot) => spot.published),
    [spots],
  );
  const [stamped, setStamped] = useState<string[]>([]);
  const [stampTimes, setStampTimes] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ id: string; name: string } | null>(null);
  const [started, setStarted] = useState(false);

  const settings = { experience: { ...experience, spots } };
  const start = publicPlayStart(settings);
  const cardSpots = visible.map((spot) => ({
    id: spot.id,
    name: spot.name,
    kind: spot.kind,
    kindLabel: spot.kind === "goal" ? "ゴール" : "スタンプ",
    stamped: stamped.includes(spot.id),
    stampedAt: stampTimes[spot.id] ?? null,
    imageUrl: spot.imageUrl,
  }));
  const completed = stampRallyCompleted(cardSpots, settings);
  const activeIndex = visible.findIndex((spot) => spot.id === activeId);
  const active = activeIndex >= 0 ? visible[activeIndex] : null;
  const moment = publicPlayMoment(settings, active?.sourceIndex ?? null);

  function stamp(id: string) {
    const spot = visible.find((item) => item.id === id);
    if (!spot || stamped.includes(id)) return;
    const blocked = orderedStampBlock(cardSpots, id, experience.basics.route);
    if (blocked) {
      setNote(blocked);
      return;
    }
    setStamped((current) => [...current, id]);
    setStampTimes((current) => ({ ...current, [id]: new Date().toISOString() }));
    setBurst({ id, name: spot.name });
    setNote(null);
    setKeyword("");
  }

  function tryKeyword() {
    if (!active) return;
    if (!rallyKeywordMatches(active.keyword, keyword)) {
      setNote("キーワードが違います");
      return;
    }
    stamp(active.id);
  }

  return (
    <div className={styles.testPlay} role="dialog" aria-modal="true" aria-label="お試しプレイ">
      <div className={styles.testSheet}>
        <div className={styles.testBar}>
          <p>お試しです。記録や特典の付与はされません。</p>
          <button type="button" onClick={onClose}>
            閉じる
          </button>
        </div>
        {!started ? (
          <div className="play-game__card play-start">
            {start.imageUrl ? <img className="play-start__photo" src={start.imageUrl} alt="" /> : null}
            {start.videoUrl ? (
              <video className="play-start__video" src={start.videoUrl} controls playsInline preload="metadata" />
            ) : null}
            <h2>{start.title.trim() || name || "スタンプラリー"}</h2>
            {start.catchCopy ? <p className="play-start__catch">{start.catchCopy}</p> : null}
            {start.description ? <p>{start.description}</p> : null}
            {periodLabel ? <p className="play-game__meta">{periodLabel}</p> : null}
            <button type="button" className="play-start__go" onClick={() => setStarted(true)}>
              {start.buttonLabel || "ラリーをはじめる"}
            </button>
          </div>
        ) : (
          <div className="play-game__card">
            <h2>{name || "スタンプラリー"}</h2>
            {active ? (
              <>
                <PlaySpotCopy
                  intro={moment.intro}
                  description={moment.description}
                  hint={moment.hint}
                  imageUrl={moment.imageUrl}
                  videoUrl={moment.videoUrl}
                  imageAlt={active.name}
                />
                <p className="play-game__meta">{active.name}</p>
                {active.checkin === "keyword" && active.keyword.trim() ? (
                  <form
                    className="play-keyword"
                    onSubmit={(event) => {
                      event.preventDefault();
                      tryKeyword();
                    }}
                  >
                    <label>
                      キーワード
                      <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                    </label>
                    <button type="submit">スタンプを押す</button>
                  </form>
                ) : active.checkin === "gps" ? (
                  <button type="button" className={styles.primary} onClick={() => stamp(active.id)}>
                    この場にいることにする
                  </button>
                ) : (
                  <button type="button" className={styles.primary} onClick={() => stamp(active.id)}>
                    スタンプを押す
                  </button>
                )}
                <button type="button" className={styles.secondary} onClick={() => setActiveId(null)}>
                  一覧へ戻る
                </button>
              </>
            ) : null}
            {note ? <p className={styles.note}>{note}</p> : null}
            {burst ? (
              <PlayStampBurst
                key={burst.id}
                message={moment.stampMessage}
                animation={moment.stampAnimation}
                already={false}
                imageUrl={moment.stampImageUrl}
                sound={moment.stampSound}
                soundUrl={moment.stampSoundUrl}
              />
            ) : null}
            {completed ? (
              <PlayClearPanel
                moment={publicPlayMoment(settings, null)}
                points={experience.reward.kind === "points" ? experience.reward.points : undefined}
                pointsAwarded
                badge={experience.reward.kind === "badge" ? experience.reward.label.trim() || "バッジ" : undefined}
                badgeAwarded
                badgeImage={experience.reward.kind === "badge" ? experience.reward.imageUrl : undefined}
                code={experience.reward.kind === "coupon" ? experience.reward.code : undefined}
              />
            ) : null}
            <PlayProgressCard
              progress={{
                nickname: "お試し",
                stampedCount: stamped.length,
                spotCount: cardSpots.length,
                completed,
                ordered: experience.basics.route === "ordered" || experience.basics.route === "any-start",
                nextSpotId: experience.basics.route === "any-start" ? anyStartNextId(cardSpots) : undefined,
                stampImageUrl: experience.screens.stamp.imageUrl,
                spots: cardSpots,
              }}
              highlightSpotId={burst?.id ?? null}
              justStampedName={burst?.name}
              asCard
              onPick={setActiveId}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import Image from "next/image";
import { Flag, Gift, MapPin, QrCode, Stamp, type LucideIcon } from "lucide-react";
import {
  GAME_SCREEN_LABEL,
  GAME_STAMP_ANIMATION_LABEL,
  GAME_STAMP_SOUND_LABEL,
  rewardLine,
  type GameExperience,
  type GameHowtoIcon,
  type GameScreenId,
} from "@/lib/organizer/game-experience";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";

const ICONS: Record<GameHowtoIcon, LucideIcon> = {
  pin: MapPin,
  qr: QrCode,
  stamp: Stamp,
  gift: Gift,
  flag: Flag,
};

type Props = {
  screen: GameScreenId;
  name: string;
  periodLabel: string | null;
  spots: { name: string; description: string; imageUrl?: string; hasPlace?: boolean }[];
  experience: GameExperience;
};

export function StampRallyPreview({ screen, name, periodLabel, spots, experience }: Props) {
  const start = experience.screens.start;
  const title = start.title.trim() || name.trim() || "ゲーム名";
  const buttonLabel = start.buttonLabel.trim() || "ラリーをはじめる";
  const firstSpot = spots[0];

  return (
    <aside id="game-create-preview" className="org-game-preview">
      <div className="org-game-preview__head">
        <h2>参加者画面プレビュー</h2>
        <p>{GAME_SCREEN_LABEL[screen]}のイメージです。公開後の画面とは少し違うことがあります。</p>
      </div>
      <div className="org-game-preview__phone">
        <div className="org-game-preview__notch" aria-hidden />
        <div className={styles.phoneScreen}>
          {screen === "start" ? (
            <>
              {start.imageUrl ? <img className={styles.phonePhoto} src={start.imageUrl} alt="" /> : null}
              {start.showFreeBadge ? <span className={styles.badge}>参加無料</span> : null}
              {start.showCharacter ? (
                <Image
                  className={styles.character}
                  src="/organizer/games/loading-mascot-1.png"
                  alt=""
                  width={68}
                  height={68}
                />
              ) : null}
              <h3 className={styles.phoneTitle}>{title}</h3>
              <p className={styles.phoneCatch}>{start.catchCopy.trim() || "キャッチコピーがここに出ます"}</p>
              {start.description.trim() ? <p className={styles.phoneBody}>{start.description}</p> : null}
              {start.steps.some((step) => step.label.trim()) ? (
                <ol className={styles.phoneSteps}>
                  {start.steps.filter((step) => step.label.trim()).map((step, index) => {
                    const Icon = ICONS[step.icon];
                    return (
                      <li key={`${step.icon}-${index}`}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        {index + 1}. {step.label}
                      </li>
                    );
                  })}
                </ol>
              ) : null}
              {start.showPeriod && periodLabel ? <p className={styles.phoneMeta}>{periodLabel}</p> : null}
              <div className={styles.phoneButton}>{buttonLabel}</div>
              {start.showShare ? <p className={styles.phoneMeta}>シェアする</p> : null}
            </>
          ) : null}

          {screen === "spot" ? (
            <>
              {firstSpot?.imageUrl ? <img className={styles.phonePhoto} src={firstSpot.imageUrl} alt="" /> : null}
              <p className={styles.phoneMeta}>スポット</p>
              <h3 className={styles.phoneTitle}>{firstSpot?.name.trim() || "スポット名"}</h3>
              <p className={styles.phoneBody}>
                {firstSpot?.description.trim() || experience.screens.spot.intro.trim() || "スポットの紹介がここに出ます"}
              </p>
              {firstSpot?.hasPlace ? <p className={styles.phoneMeta}>地図で場所を確認できます</p> : null}
            </>
          ) : null}

          {screen === "stamp" ? (
            <div className={styles.stampPop}>
              {experience.screens.stamp.imageUrl ? (
                <img className="play-stamp__mark" src={experience.screens.stamp.imageUrl} alt="" />
              ) : (
                <Stamp className="h-8 w-8" strokeWidth={1.7} aria-hidden />
              )}
              <strong>{experience.screens.stamp.message.trim() || "スタンプGET！"}</strong>
              <span className={styles.phoneMeta}>
                {GAME_STAMP_ANIMATION_LABEL[experience.screens.stamp.animation]}
                {experience.screens.stamp.sound !== "none"
                  ? ` ・ ${GAME_STAMP_SOUND_LABEL[experience.screens.stamp.sound]}`
                  : ""}
              </span>
            </div>
          ) : null}

          {screen === "clear" ? (
            <>
              {start.showCharacter ? (
                <Image
                  className={styles.character}
                  src="/organizer/games/loading-mascot-1.png"
                  alt=""
                  width={68}
                  height={68}
                />
              ) : null}
              <h3 className={styles.phoneTitle}>{experience.screens.clear.title.trim() || "コンプリート！"}</h3>
              <p className={styles.phoneBody}>
                {experience.screens.clear.message.trim() || "クリアしたときのメッセージがここに出ます"}
              </p>
              {experience.reward.label.trim() ? (
                <p className={styles.phoneMeta}>{rewardLine(experience.reward.kind, experience.reward.label)}</p>
              ) : null}
              {experience.reward.kind === "coupon" && experience.reward.code.trim() ? (
                <p className={styles.phoneCode}>{experience.reward.code.trim()}</p>
              ) : null}
              {experience.reward.kind === "points" ? (
                <p className={styles.phoneCode}>{experience.reward.points}ポイント</p>
              ) : null}
              {experience.reward.kind === "badge" ? (
                <p className={styles.phoneCode}>{experience.reward.label.trim() || "バッジ"}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import { GameImageField } from "@/components/organizer/games/GameImageField";
import { GameVideoField } from "@/components/organizer/games/GameVideoField";
import type { GameLookEdit } from "@/components/organizer/games/GamePhonePreview";
import { DEFAULT_GAME_LOOK, type GameLook } from "@/lib/organizer/game-look";

/** 参加画面のアイコンと背景。作成画面で持ち、プレビューの上で変える。保存では body.look に入れる。 */
export function useGameLookEdit(): {
  look: GameLook;
  lookEdit: GameLookEdit;
  /** 下書きを開き直したときに、保存した見た目をそのまま入れる。 */
  setLook: (look: GameLook) => void;
} {
  const [look, setLook] = useState<GameLook>(DEFAULT_GAME_LOOK);
  return {
    look,
    setLook,
    lookEdit: {
      value: look,
      onChange: setLook,
      update: setLook,
      bgImageField: (
        <GameImageField
          label="背景の写真"
          url={look.bgImageUrl}
          onChange={(bgImageUrl) => setLook((current) => ({ ...current, bgImageUrl }))}
        />
      ),
      videoField: (onUploaded) => (
        <GameVideoField
          label="動画をアップロード"
          url=""
          onChange={(url) => {
            if (url) onUploaded(url);
          }}
        />
      ),
      uploadField: (onUploaded) => (
        <GameImageField
          label="写真をアップロード"
          url=""
          onChange={(url) => {
            if (url) onUploaded(url);
          }}
        />
      ),
    },
  };
}

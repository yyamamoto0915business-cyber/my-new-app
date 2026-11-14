"use client";

import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { MISSION_KINDS, type MissionKindId } from "@/lib/organizer/mission";

/**
 * ゲームの部品を足す（画面案 ③）。部品を「行く」「答える」「集める」に分けて見せる。
 * 今の部品はミッションの種類（lib/organizer/mission.ts）。新しい部品はここに足していく。
 */
const GROUPS: { label: string; color: string; kinds: MissionKindId[] }[] = [
  { label: "行く", color: "#2f7d4e", kinds: ["visit", "checkin", "keyword"] },
  { label: "答える", color: "#a26a10", kinds: ["quiz"] },
  { label: "集める", color: "#2f6fae", kinds: ["photo", "friends"] },
];

/** 部品の短い説明（カードの2行目） */
const SHORT: Record<MissionKindId, string> = {
  visit: "近くに来たら達成（GPS）",
  checkin: "その場所でチェックイン",
  keyword: "見つけた合言葉を入れる",
  quiz: "正解したら達成",
  photo: "撮って投稿する",
  friends: "友だちと一緒に参加",
};

export function missionKindGroupLabel(kind: MissionKindId): { label: string; color: string } {
  const g = GROUPS.find((group) => group.kinds.includes(kind));
  return g ? { label: g.label, color: g.color } : { label: "", color: "#5f6d64" };
}

export function MissionAddSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (kind: MissionKindId) => void;
}) {
  if (!open || typeof document === "undefined") return null;
  const labelOf = (id: MissionKindId) => MISSION_KINDS.find((k) => k.id === id)?.label ?? id;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/35 pc:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-add-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[22px] bg-[#fbfcf9] p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pc:rounded-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="mission-add-title" className="text-[18px] font-bold text-[#163828]">
            部品を足す
          </h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="flex h-11 w-11 items-center justify-center rounded-full text-[#5f6d64]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          {GROUPS.map((g) => (
            <div key={g.label} className="space-y-1.5">
              <p className="text-[12.5px] font-bold" style={{ color: g.color }}>
                {g.label}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {g.kinds.map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => onPick(kind)}
                    className="flex min-h-[64px] flex-col items-start gap-0.5 rounded-[14px] border border-[#e3e8e3] bg-white p-2.5 text-left active:bg-[#f3f6f1]"
                  >
                    <span className="text-[13px] font-bold text-[#163828]">{labelOf(kind)}</span>
                    <span className="text-[10.5px] leading-snug text-[#5f6d64]">{SHORT[kind]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11.5px] leading-relaxed text-[#6b776f]">
            クリアしたときのごほうび（スタンプ・ポイント）は、部品ごとと「達成条件・特典」で決めます。
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

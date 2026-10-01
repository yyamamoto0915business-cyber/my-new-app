"use client";

import Image from "next/image";
import { Camera, CircleHelp, Flag, KeyRound, MapPin, Smartphone, Tablet, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MISSION_TIPS,
  missionKindLabel,
  type MissionItem,
  type MissionKindId,
} from "@/lib/organizer/mission";

const KIND_ICONS: Record<MissionKindId, LucideIcon> = {
  visit: MapPin,
  photo: Camera,
  keyword: KeyRound,
  checkin: Flag,
  quiz: CircleHelp,
  friends: Users,
};

type Props = {
  name: string;
  periodLabel: string | null;
  missions: MissionItem[];
  device: "phone" | "tablet";
  onDevice: (device: "phone" | "tablet") => void;
};

export function OrganizerMissionPreview({ name, periodLabel, missions, device, onDevice }: Props) {
  const title = name.trim() || "ミッション";
  const shown = missions.slice(0, 6);
  const doneCount = shown.length >= 2 ? Math.max(1, Math.floor(shown.length / 2)) : 0;
  const next = shown[doneCount] ?? shown[0] ?? null;
  const tip = next ? MISSION_TIPS[next.kind] : "ミッションを追加すると、ここに表示されます。";
  const progress = shown.length > 0 ? Math.round((doneCount / shown.length) * 100) : 0;

  return (
    <aside className="org-mission__preview">
      <div className="org-mission__preview-head">
        <h2>参加者プレビュー</h2>
        <p>実際の参加者の画面イメージを確認できます。</p>
      </div>
      <div className="org-mission__devices" role="tablist" aria-label="プレビューの画面サイズ">
        <button
          type="button"
          role="tab"
          aria-selected={device === "phone"}
          className={cn(device === "phone" && "is-on")}
          onClick={() => onDevice("phone")}
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden />
          スマートフォン
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={device === "tablet"}
          className={cn(device === "tablet" && "is-on")}
          onClick={() => onDevice("tablet")}
        >
          <Tablet className="h-3.5 w-3.5" aria-hidden />
          タブレット
        </button>
      </div>
      <div className={cn("org-mission__device", device === "tablet" && "is-tablet")}>
        <div className="org-mission__device-bar" aria-hidden>
          <span>9:41</span>
        </div>
        <div className="org-mission__device-hero">
          <Image src="/organizer/games/games-hero.png" alt="" width={640} height={280} unoptimized />
        </div>
        <div className="org-mission__device-body">
          <h3>{title}</h3>
          {periodLabel ? <p className="org-mission__device-period">{periodLabel}</p> : null}
          <div className="org-mission__device-progress">
            <strong>
              {doneCount}/{shown.length} ミッション達成
            </strong>
            <span>
              <i style={{ width: `${progress}%` }} />
            </span>
          </div>
          {shown.length === 0 ? (
            <p className="org-mission__device-empty">ミッションを追加すると、参加画面のイメージが出ます。</p>
          ) : (
            <ul className="org-mission__device-list">
              {shown.map((mission, index) => {
                const Icon = KIND_ICONS[mission.kind];
                const done = index < doneCount;
                return (
                  <li key={mission.key} className={cn(done && "is-done")}>
                    <span className="org-mission__device-mark" aria-hidden>
                      {done ? "✓" : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <strong>{mission.name.trim() || "ミッション名"}</strong>
                      <em>{missionKindLabel(mission.kind)}</em>
                    </span>
                    <b>{done ? "達成済み" : "未達成"}</b>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="org-mission__device-cta">ミッションを進める</p>
          <div className="org-mission__device-tip">
            <Image src="/organizer/games/game-type-mission.png" alt="" width={72} height={72} unoptimized />
            <p>{tip}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

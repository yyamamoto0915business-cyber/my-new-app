"use client";

import Image from "next/image";
import { MachiFeedCard } from "@/components/machi/MachiFeedCard";
import { ImageUploadTile } from "@/components/organizer/games/GameImageField";
import { gameToMachiItem } from "@/lib/machi/feed";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import type { OrganizerGameTypeId } from "@/lib/organizer/game-types";
import { cn } from "@/lib/utils";

/** 種類ごとの決まった絵（画像がないときのカード）。 */
export function gameTypeCover(type: OrganizerGameTypeId): string {
  return `/organizer/games/game-type-${type}.png`;
}

/** まちの情報に出るカードの中身（作成画面の見本と、公開後のお知らせで同じものを使う）。 */
export function gameCardItem(input: {
  type: OrganizerGameTypeId;
  typeLabel: string;
  name: string;
  startDate: string;
  event: OrganizerGameEventOption | null;
  cardImage: string;
}) {
  return gameToMachiItem({
    id: "preview",
    type: input.type,
    typeLabel: input.typeLabel,
    name: input.name.trim() || input.typeLabel,
    description: "",
    startsAt: input.startDate ? `${input.startDate}T00:00:00+09:00` : null,
    endsAt: null,
    joinPath: "#",
    imageUrl: input.cardImage || input.event?.imageUrl || gameTypeCover(input.type),
    areaLabel: input.event?.area || input.event?.title || "地域のゲーム",
    eventTitle: input.event?.title ?? null,
  });
}

/**
 * 「まちの情報に出るカード」：本物と同じカードの見本と、カードの画像の選び方。
 * 画像は「自分で選んだ画像」→「対象イベントの画像（参加パスと同じ）」→「種類ごとの絵」の順で使われる。
 */
export function GameCardSetup({
  type,
  typeLabel,
  name,
  startDate,
  event,
  cardImage,
  onCardImage,
}: {
  type: OrganizerGameTypeId;
  typeLabel: string;
  name: string;
  startDate: string;
  event: OrganizerGameEventOption | null;
  cardImage: string;
  onCardImage: (url: string) => void;
}) {
  const item = gameCardItem({ type, typeLabel, name, startDate, event, cardImage });
  const choices = [
    ...(event?.imageUrl ? [{ id: "event", label: "イベントの画像", url: event.imageUrl, value: "" }] : []),
    { id: "type", label: "種類の絵", url: gameTypeCover(type), value: event?.imageUrl ? gameTypeCover(type) : "" },
  ];
  return (
    <div style={{ display: "grid", gap: "0.6rem", marginTop: "0.8rem", padding: "0.8rem", border: "1px solid #e4ece6", borderRadius: "1rem", background: "#fbfcfb" }}>
      <div>
        <b style={{ fontSize: "0.9rem", color: "#1a2214" }}>まちの情報に出るカード</b>
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.74rem", color: "#5d6b62", lineHeight: 1.5 }}>
          公開すると、「まちの情報」のゲームの一覧に、このカードで載ります。
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: "min(11rem, 46%)", flex: "none" }} aria-label="カードの見本">
          <MachiFeedCard item={item} />
        </div>
        <div style={{ display: "grid", gap: "0.4rem", flex: 1, minWidth: "10rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#3c4a40" }}>カードの画像</span>
          <ul className="org-photo__thumbs" style={{ margin: 0 }}>
            {choices.map((choice) => {
              const on = cardImage ? cardImage === choice.url : choice.value === "" && (choice.id === "event" || !event?.imageUrl);
              return (
                <li key={choice.id} style={{ display: "grid", gap: "0.15rem", justifyItems: "center" }}>
                  <button type="button" className={cn(on && "is-on")} onClick={() => onCardImage(choice.value)} title={choice.label}>
                    <Image src={choice.url} alt="" width={80} height={56} unoptimized />
                  </button>
                  <small style={{ fontSize: "0.6rem", color: "#6a7568" }}>{choice.label}</small>
                </li>
              );
            })}
            {cardImage && !choices.some((choice) => choice.url === cardImage) ? (
              <li style={{ display: "grid", gap: "0.15rem", justifyItems: "center" }}>
                <button type="button" className="is-on" title="選んだ画像">
                  <Image src={cardImage} alt="" width={80} height={56} unoptimized />
                </button>
                <small style={{ fontSize: "0.6rem", color: "#6a7568" }}>選んだ画像</small>
              </li>
            ) : null}
            <li style={{ display: "grid", gap: "0.15rem", justifyItems: "center" }}>
              <ImageUploadTile onUploaded={onCardImage} />
              <small style={{ fontSize: "0.6rem", color: "#6a7568" }}>自分の写真</small>
            </li>
          </ul>
          {event ? null : (
            <p style={{ margin: 0, padding: "0.5rem 0.65rem", borderRadius: "0.6rem", background: "#fff4dc", color: "#8a5a00", fontSize: "0.72rem", lineHeight: 1.5 }}>
              対象イベントを選ぶと、イベントの写真（参加パスと同じ）と場所で載ります。いまは場所が「地域のゲーム」になります。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

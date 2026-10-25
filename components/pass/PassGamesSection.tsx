"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, ChevronDown, Gamepad2, KeyRound, MapPin } from "lucide-react";
import type { ParticipationPass } from "@/lib/participation-pass";
import { formatPassDateRange } from "@/lib/participation-pass";
import type { EventPassGame } from "@/app/api/events/[id]/games/route";

const SECTION_ID = "pass-event-games";

// パスの上の案内と下のゲーム欄で、同じイベントを二度読みに行かない。
const cache = new Map<string, Promise<EventPassGame[]>>();

function loadEventPassGames(eventId: string): Promise<EventPassGame[]> {
  const hit = cache.get(eventId);
  if (hit) return hit;
  const request = fetch(`/api/events/${encodeURIComponent(eventId)}/games`, { cache: "no-store" })
    .then(async (res) => (res.ok ? (((await res.json()) as { games?: EventPassGame[] }).games ?? []) : []))
    .catch(() => [] as EventPassGame[]);
  cache.set(eventId, request);
  return request;
}

function useEventPassGames(eventId: string): EventPassGame[] {
  const [games, setGames] = useState<EventPassGame[]>([]);
  useEffect(() => {
    let cancelled = false;
    void loadEventPassGames(eventId).then((list) => {
      if (!cancelled) setGames(list);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);
  return games;
}

/** パスのいちばん上に出す案内。押すと、下のゲーム欄（始め方）へ移る。 */
export function PassGamesNotice({ eventId }: { eventId: string }) {
  const games = useEventPassGames(eventId);
  if (games.length === 0) return null;
  const hasCode = games.some((game) => game.participation === "remote" && game.joinCode);
  return (
    <button
      type="button"
      onClick={() => document.getElementById(SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="mb-2.5 flex w-full shrink-0 items-center gap-2.5 rounded-2xl border border-[#cfe5d6] bg-[#eef8f1] px-3.5 py-2.5 text-left transition hover:bg-[#e4f3e9]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1f7a4a] text-white">
        <Gamepad2 className="h-4.5 w-4.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-[#1a5c38]">このイベントにはゲームがあります</span>
        <span className="block text-[11.5px] leading-snug text-[#3c4a40]">
          {hasCode ? "参加コードを入れて、ゲームを始めましょう" : "始め方を確認しましょう"}
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-[#1f7a4a]" aria-hidden />
    </button>
  );
}

/**
 * 申し込んだイベントのゲーム。
 * どこからでも参加できるゲームは参加コードを出し、コードを入れて始める流れを案内する。
 * 現地で参加するゲームは、会場やスポットのQRから始める。
 */
export function PassGamesSection({ eventId }: { eventId: string }) {
  const games = useEventPassGames(eventId);
  if (games.length === 0) return null;

  return (
    <section
      id={SECTION_ID}
      className="mt-2.5 shrink-0 scroll-mt-24 rounded-2xl border border-[#cfe5d6] bg-white p-3"
      aria-label="このイベントのゲーム"
    >
      <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1a5c38]">
        <Gamepad2 className="h-4 w-4" aria-hidden />
        このイベントのゲーム
      </p>
      <ul className="mt-2 grid gap-2">
        {games.map((game) => (
          <li key={game.id} className="rounded-xl bg-[#f5f9f6] px-3 py-3">
            <p className="text-[10.5px] font-semibold text-[#5d6b62]">{game.typeLabel}</p>
            <p className="text-[13.5px] font-bold leading-snug text-[#1a2214]">{game.name}</p>
            <PassGameGuide game={game} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** ゲームの始め方。どこからでも参加なら参加コードと手順、現地参加ならQRの案内。 */
export function PassGameGuide({
  game,
}: {
  game: Pick<EventPassGame, "participation" | "joinCode" | "joinPath">;
}) {
  return (
    <>
      {game.participation === "remote" ? (
        <>
          <ol className="mt-2 grid gap-1.5 text-[11.5px] leading-snug text-[#3c4a40]">
            <li className="flex gap-1.5">
              <b className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-[#1f7a4a] text-[10px] text-white">1</b>
              「コードを入れて始める」を押す
            </li>
            <li className="flex gap-1.5">
              <b className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-[#1f7a4a] text-[10px] text-white">2</b>
              下の参加コードを入れて「参加する」
            </li>
          </ol>
          {game.joinCode ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#9fcbad] bg-white px-3 py-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#3c4a40]">
                <KeyRound className="h-3.5 w-3.5 text-[#1f7a4a]" aria-hidden />
                参加コード
              </span>
              <b className="font-mono text-[20px] tracking-[0.22em] text-[#1a2214]">{game.joinCode}</b>
            </div>
          ) : null}
          <Link
            href={game.joinCode ? `/play/code?code=${encodeURIComponent(game.joinCode)}` : game.joinPath}
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-[#1f7a4a] text-[13px] font-bold text-white transition hover:bg-[#19663d]"
          >
            コードを入れて始める
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <p className="mt-1.5 text-center text-[10.5px] leading-snug text-[#6a7568]">
            ほかのスマホやパソコンでも、このコードで始められます。
          </p>
        </>
      ) : (
        <>
          <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-[#3c4a40]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1f7a4a]" aria-hidden />
            現地で参加するゲームです。当日、会場やスポットのQRを読んで始めてください。
          </p>
          <Link href={game.joinPath} className="mt-1.5 inline-flex text-[11.5px] font-bold text-[#1f7a4a] underline">
            ゲームのページを見る
          </Link>
        </>
      )}
    </>
  );
}

/** ゲームに申し込んだときの参加パス。受付のQRではなく、ゲームの始め方を出す。 */
export function GamePassTicket({ pass }: { pass: ParticipationPass }) {
  const game = pass.game;
  if (!game) return null;
  return (
    <div className="flex min-h-0 flex-col">
      <article className="relative flex flex-col overflow-hidden rounded-2xl border border-[#dce8de] bg-white shadow-[0_6px_20px_rgba(40,60,48,0.07)]">
        <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden bg-[#eef2ee]">
          <Image src={pass.eventImage} alt="" fill className="object-cover" sizes="(max-width: 900px) 100vw, 400px" priority />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#1f7a4a] shadow-sm">
            <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
            {game.typeLabel}
          </span>
        </div>
        <div className="space-y-1.5 px-4 pb-3 pt-3">
          <h3 className="text-[15px] font-bold leading-snug text-[#1a2818]">{pass.eventTitle}</h3>
          <p className="flex items-center gap-1.5 text-[12px] text-[#3a4840]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
            {game.periodLabel ?? formatPassDateRange(pass.startAt, pass.endAt)}
          </p>
          <p className="flex items-center gap-1.5 text-[12px] text-[#3a4840]">
            {game.participation === "remote" ? (
              <KeyRound className="h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#4a9a68]" aria-hidden />
            )}
            {pass.venueName}
          </p>
          <p className="flex items-center gap-1.5 text-[11.5px] text-[#5d6b62]">
            {pass.attendeeName}
            <span aria-hidden>・</span># {pass.receptionNumber}
          </p>
        </div>
        <div className="border-t border-dashed border-[#c8d8cc] px-4 pb-4 pt-3">
          <p className="text-[12.5px] font-bold text-[#1a5c38]">ゲームの始め方</p>
          <PassGameGuide game={game} />
          {game.note ? (
            <div className="mt-3 rounded-xl bg-[#f5f9f6] px-3 py-2.5">
              <p className="text-[11px] font-bold text-[#5d6b62]">申し込み・参加について</p>
              <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-[#1a2818]">{game.note}</p>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

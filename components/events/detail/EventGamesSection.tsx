import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Gamepad2, KeyRound, MapPin } from "lucide-react";
import type { EventLinkedGame } from "@/lib/organizer/public-games";

/**
 * イベントで遊べるゲーム。申し込むと、参加パスからゲームに参加できる。
 * 現地で参加するゲームはQRで、どこからでも参加できるゲームは参加コードで始める。
 */
export function EventGamesSection({ games, className = "" }: { games: EventLinkedGame[]; className?: string }) {
  if (games.length === 0) return null;
  return (
    <section
      className={`rounded-2xl border border-[#dfe9e1] bg-white p-4 shadow-[0_1px_4px_rgba(44,42,40,0.05)] ${className}`}
      aria-labelledby="event-games-heading"
    >
      <h2 id="event-games-heading" className="flex items-center gap-1.5 text-[14px] font-bold text-[#1a2818]">
        <Gamepad2 className="h-4 w-4 text-[#2d7a4f]" aria-hidden />
        このイベントで遊べるゲーム
      </h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[#5d6b62]">
        申し込むと、参加パスからゲームに参加できます。
      </p>
      <ul className="mt-3 grid gap-2 min-[900px]:grid-cols-2">
        {games.map((game) => (
          <li key={game.id}>
            <Link
              href={game.joinPath}
              className="flex items-center gap-3 rounded-xl border border-[#e8efe9] bg-[#f8fbf8] p-2 transition hover:border-[#bcd8c4] hover:bg-[#f1f8f3]"
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#e7f0e4]">
                <Image src={game.imageUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10.5px] font-semibold text-[#5d6b62]">{game.typeLabel}</span>
                <span className="block truncate text-[13.5px] font-bold text-[#1a2214]">{game.name}</span>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-[#2d7a4f] ring-1 ring-[#d6eadc]">
                  {game.participation === "remote" ? (
                    <>
                      <KeyRound className="h-3 w-3" aria-hidden />
                      どこからでも参加（参加コード）
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" aria-hidden />
                      現地で参加（QR）
                    </>
                  )}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#8a9e80]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

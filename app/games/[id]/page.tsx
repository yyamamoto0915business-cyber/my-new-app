import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Gamepad2, KeyRound, MapPin, UserRound, Users } from "lucide-react";
import { getPlayDb } from "@/lib/organizer/play";
import { getPublicGameDetail, type PublicGameDetail } from "@/lib/organizer/public-games";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";

type Props = { params: Promise<{ id: string }> };

async function load(id: string): Promise<PublicGameDetail | null> {
  const db = getPlayDb();
  if (!db) return null;
  return getPublicGameDetail(db, id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await load(id);
  if (!game) return { title: "ゲーム | MachiGlyph" };
  return {
    title: `${game.name} | MachiGlyph`,
    description: game.catchCopy || game.description.slice(0, 100) || `${game.typeLabel}のゲームです`,
  };
}

function jstDay(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

function periodLabel(game: PublicGameDetail): string {
  const a = jstDay(game.startsAt);
  const b = jstDay(game.endsAt);
  if (a && b) return a === b ? a : `${a} 〜 ${b}`;
  if (a) return `${a} から`;
  if (b) return `${b} まで`;
  return "期間の決まりなし";
}

function audienceLabel(game: PublicGameDetail): string {
  if (game.audience === "event") return "イベントに申し込んだ人";
  if (game.audience === "pass") return "参加パスを持っている人";
  if (game.audience === "entry") return "このゲームに申し込んだ人（無料）";
  return "だれでも";
}

/**
 * ゲームの詳細。イベント・ボランティアと同じく、まず中身と参加のしかたを見てから「参加する」へ進む。
 */
export default async function GameDetailPage({ params }: Props) {
  const { id } = await params;
  const game = await load(id);
  if (!game) notFound();

  const needsEvent = Boolean(game.event) && (game.audience === "event" || game.audience === "pass");
  const rows = [
    { Icon: CalendarDays, label: "期間", value: periodLabel(game) },
    {
      Icon: game.participation === "remote" ? KeyRound : MapPin,
      label: "参加のしかた",
      value: game.participation === "remote" ? "どこからでも（スマホやパソコンで）" : "現地で（会場のQRを読む）",
    },
    { Icon: Users, label: "参加できる人", value: audienceLabel(game) },
    ...(game.organizer ? [{ Icon: UserRound, label: "主催", value: game.organizer.name }] : []),
  ];

  const cta = game.ended ? (
    <p className="rounded-2xl bg-[#eef1ec] px-4 py-3.5 text-center text-[14px] font-bold text-[#6b776f]">このゲームは終了しました</p>
  ) : (
    <div className="space-y-2">
      <Link
        href={game.joinPath}
        className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[15.5px] font-bold text-[#f6ebc8] shadow-[0_4px_12px_rgba(14,42,29,0.22)] transition hover:opacity-95"
      >
        <Gamepad2 className="h-5 w-5" aria-hidden />
        ゲームに参加する
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
      {needsEvent && game.event ? (
        <p className="text-center text-[12px] leading-relaxed text-[#6b776f]">
          「{game.event.title}」に申し込むと参加できます。
          <Link href={`/events/${game.event.id}`} className="ml-1 font-bold text-[#1f6a42] underline">
            イベントを見る
          </Link>
        </p>
      ) : game.audience === "entry" ? (
        <p className="text-center text-[12px] text-[#6b776f]">はじめに、かんたんな申し込み（無料）があります。</p>
      ) : (
        <p className="text-center text-[12px] text-[#6b776f]">申し込みなしで、すぐ参加できます。</p>
      )}
    </div>
  );

  return (
    <main className="min-h-screen-dvh bg-[#f7f6f2] pb-28 min-[900px]:pb-12">
      <div className="mx-auto w-full max-w-[1040px] px-4 pt-3 min-[900px]:px-6 min-[900px]:pt-6">
        <Link href="/?kind=game" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2d7a4f] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          ゲーム一覧へ
        </Link>

        <div className="mt-3 min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_340px] min-[900px]:items-start min-[900px]:gap-6">
          <div className="space-y-4">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[20px] border border-[#e6e2d6] bg-white shadow-[0_2px_12px_rgba(23,63,44,0.07)]">
              <Image src={game.imageUrl} alt="" fill priority sizes="(min-width: 900px) 640px, 100vw" className="object-cover" unoptimized />
              <span className="absolute left-3 top-3 rounded-full bg-[#173f2c] px-3 py-1 text-[12px] font-bold text-[#f6ebc8] shadow">
                {game.typeLabel}
              </span>
            </div>

            <header>
              <OrgEyebrow>GAME</OrgEyebrow>
              <h1 className="mt-1 text-[24px] font-semibold leading-snug tracking-[0.03em] text-[#163828] min-[900px]:text-[28px]" style={{ fontFamily: ORG_SERIF }}>
                {game.name}
              </h1>
              {game.catchCopy ? <p className="mt-1.5 text-[14px] leading-relaxed text-[#4a5a50]">{game.catchCopy}</p> : null}
            </header>

            {/* スマホ：参加のしかたと「参加する」を上に */}
            <section className="rounded-[18px] border border-[#e6e2d6] bg-white p-4 min-[900px]:hidden">
              <InfoRows rows={rows} />
              <div className="mt-4">{cta}</div>
            </section>

            {game.description ? (
              <section className="rounded-[18px] border border-[#e6e2d6] bg-white p-4 min-[900px]:p-5">
                <h2 className="mb-2 text-[14px] font-bold text-[#173f2c]">ゲームについて</h2>
                <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[#3c4a40]">{game.description}</p>
              </section>
            ) : null}

            {game.event ? (
              <Link
                href={`/events/${game.event.id}`}
                className="flex items-center gap-3 rounded-[18px] border border-[#e6e2d6] bg-white p-3 transition hover:border-[#c9a54e]"
              >
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#eef4ef]">
                  {game.event.imageUrl ? <Image src={game.event.imageUrl} alt="" fill sizes="80px" className="object-cover" unoptimized /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold text-[#a3812f]">このゲームのイベント</span>
                  <span className="block truncate text-[14px] font-bold text-[#163828]">{game.event.title}</span>
                  <span className="block truncate text-[12px] text-[#6b776f]">
                    {[game.event.date, game.event.location].filter(Boolean).join("・")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#8a9e80]" aria-hidden />
              </Link>
            ) : null}
          </div>

          {/* PC：右に参加のしかたと「参加する」（スクロールしても残る） */}
          <aside className="hidden min-[900px]:sticky min-[900px]:top-[calc(var(--mg-pc-top-nav-h,52px)+1.5rem)] min-[900px]:block">
            <section className="rounded-[20px] border border-[#e6e2d6] bg-white p-5 shadow-[0_4px_16px_rgba(23,63,44,0.07)]">
              <InfoRows rows={rows} />
              <div className="mt-5">{cta}</div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoRows({ rows }: { rows: { Icon: typeof CalendarDays; label: string; value: string }[] }) {
  return (
    <dl className="space-y-2.5">
      {rows.map(({ Icon, label, value }) => (
        <div key={label} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef5f0] text-[#1f6a42]">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold text-[#8a968c]">{label}</dt>
            <dd className="text-[13.5px] font-semibold leading-snug text-[#1f2a24]">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

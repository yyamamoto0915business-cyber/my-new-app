import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Infinity as InfinityIcon, Timer } from "lucide-react";
import { LISTING_KIND_META, type ListingKind } from "@/components/organizer/mobile/listing-kinds";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { ORG_SERIF, OrgEyebrow } from "@/components/organizer/mobile/organizer-theme";
import { PlanBadge } from "@/components/organizer/mobile/plan-badge";

export const metadata: Metadata = {
  title: "新しく掲載する | MachiGlyph",
};

type Choice = {
  kind: ListingKind;
  href: string;
  title: string;
  desc: string;
  /** いつまで載るか（掲載管理の見出しの札と同じ言い方） */
  term: string;
  always?: boolean;
};

/** いちばん多く使うイベントは大きく、ほかの4つは2列に並べる（5つとも1画面に収める） */
const FEATURED: Choice = {
  kind: "event",
  href: "/organizer/events/new",
  title: "イベントを掲載",
  desc: "お祭り・マルシェ・講座など",
  term: "開催日まで",
};

const OTHERS: Choice[] = [
  { kind: "store", href: "/organizer/stores/new", title: "お店", desc: "カフェ・飲食店・商店", term: "ずっと掲載", always: true },
  { kind: "kitchen", href: "/organizer/kitchen-cars/new", title: "キッチンカー", desc: "出店・メニュー・予定", term: "ずっと掲載", always: true },
  { kind: "volunteer", href: "/organizer/recruitments/new", title: "ボランティア募集", desc: "活動・スタッフ募集", term: "締切まで" },
  { kind: "game", href: "/organizer/games?pick=1", title: "ゲーム", desc: "スタンプラリー・クイズ", term: "開催期間まで" },
];

function TermChip({ term, always, onDark = false }: { term: string; always?: boolean; onDark?: boolean }) {
  const Icon = always ? InfinityIcon : Timer;
  return (
    <span
      className={
        onDark
          ? "inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-[3px] text-[10.5px] font-bold text-[#e6d29b]"
          : always
            ? "inline-flex items-center gap-1 rounded-full bg-[#eef4ef] px-2 py-[3px] text-[10.5px] font-bold text-[#2f6b4a]"
            : "inline-flex items-center gap-1 rounded-full bg-[#fbf3e1] px-2 py-[3px] text-[10.5px] font-bold text-[#a3812f]"
      }
    >
      <Icon className="h-3 w-3" aria-hidden />
      {term}
    </span>
  );
}

/** 主催者：新しく掲載する。何を載せるかを選んで、それぞれの作成画面へ進む */
export default function OrganizerNewListingPage() {
  const featured = LISTING_KIND_META[FEATURED.kind];
  const FeaturedIcon = featured.Icon;
  return (
    <OrganizerRegistrationGate>
      <div className="mx-auto w-full max-w-xl pb-6 tablet:max-w-[860px]">
        {/* 見出し（前の大きなゴシックの見出し・飾りの「＋」・説明の帯は、選ぶ所を下に押しやっていたので小さくまとめた） */}
        <header className="pt-1">
          <OrgEyebrow>NEW LISTING</OrgEyebrow>
          <h1
            className="mt-1 text-[22px] font-bold leading-tight tracking-[0.04em] text-[#173f2c]"
            style={{ fontFamily: ORG_SERIF }}
          >
            新しく掲載する
          </h1>
          <p className="mt-1 text-[12.5px] text-[#6b776f]">載せたいものを選ぶと、作る画面に進みます。</p>
        </header>

        {/* イベント（いちばん使うので大きく） */}
        <Link
          href={FEATURED.href}
          className="relative mt-4 flex items-center gap-3.5 overflow-hidden rounded-[20px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-br from-[#245a3e] to-[#173f2c] p-4 text-[#f6ebc8] shadow-[0_6px_18px_rgba(14,42,29,0.22)] transition active:scale-[0.98]"
        >
          <span
            className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-[#c9a54e]/15"
            aria-hidden
          />
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-[#f6ebc8] text-[#c7742c]"
            aria-hidden
          >
            <FeaturedIcon className="h-7 w-7" strokeWidth={1.9} />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-[17px] font-bold leading-snug text-white">{FEATURED.title}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[#dfe8e1]">{FEATURED.desc}</span>
            <span className="mt-2 block">
              <TermChip term={FEATURED.term} onDark />
            </span>
          </span>
          <span
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6ebc8] text-[#173f2c]"
            aria-hidden
          >
            <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </span>
        </Link>

        {/* ほかの4つ（2列。タブレットは4列） */}
        <ul className="mt-3 grid grid-cols-2 gap-2.5 tablet:grid-cols-4">
          {OTHERS.map((c) => {
            const { Icon, color, bg } = LISTING_KIND_META[c.kind];
            return (
              <li key={c.kind}>
                <Link
                  href={c.href}
                  className="flex h-full flex-col rounded-[18px] border border-[#e6e2d6] bg-white p-3.5 shadow-[0_2px_8px_rgba(22,56,40,0.05)] transition active:scale-[0.97] active:bg-[#fbfaf6]"
                >
                  <span className="flex items-start justify-between">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                      style={{ background: bg, color }}
                      aria-hidden
                    >
                      <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 text-[#b4bbb6]" aria-hidden />
                  </span>
                  <span className="mt-2.5 flex items-center gap-1.5 text-[15px] font-bold leading-snug text-[#173f2c]">
                    {c.title}
                    {c.kind === "game" ? <PlanBadge feature="games" /> : null}
                  </span>
                  <span className="mt-0.5 block flex-1 text-[11.5px] leading-snug text-[#6b776f]">{c.desc}</span>
                  <span className="mt-2 block">
                    <TermChip term={c.term} always={c.always} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 作りかけは掲載管理から続ける */}
        <Link
          href="/organizer/listings"
          className="mt-4 flex items-center justify-center gap-1 rounded-[14px] py-3 text-[13px] font-semibold text-[#3f6250] active:bg-[#eef3ef]"
        >
          作りかけの下書きは「掲載管理」から続けられます
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </OrganizerRegistrationGate>
  );
}

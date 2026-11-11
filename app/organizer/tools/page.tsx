import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Crown,
  Gamepad2,
  Inbox,
  LayoutGrid,
  Landmark,
  QrCode,
  Sparkles,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageTitle } from "@/components/organizer/mobile/OrganizerPageTitle";

export const metadata: Metadata = {
  title: "運営ツール | MachiGlyph",
};

type Tool = {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  /** 文字とアイコンの色・カードの下地 */
  color: string;
  bg: string;
};

/** 見本どおりの4つ（2×2） */
const MAIN_TOOLS: Tool[] = [
  {
    href: "/organizer/events",
    title: "ダッシュボード",
    desc: "来場・応募・進行",
    Icon: BarChart3,
    color: "#2f7d4e",
    bg: "linear-gradient(160deg,#f3faf4,#ffffff)",
  },
  {
    href: "/organizer/pos",
    title: "レジ",
    desc: "販売・売上管理",
    Icon: Wallet,
    color: "#2f6fae",
    bg: "linear-gradient(160deg,#eef5fc,#ffffff)",
  },
  {
    href: "/organizer/games",
    title: "ゲーム",
    desc: "ラリー・クイズ",
    Icon: Gamepad2,
    color: "#7a5cc0",
    bg: "linear-gradient(160deg,#f4effb,#ffffff)",
  },
  {
    href: "/organizer/settings/plan",
    title: "プラン",
    desc: "契約・機能を確認",
    Icon: Crown,
    color: "#b07a1c",
    bg: "linear-gradient(160deg,#fdf7e8,#ffffff)",
  },
];

/** そのほかの機能（スマホの上のタブ帯をなくしたので、ここから行けるようにする） */
const MORE_TOOLS: { href: string; title: string; desc: string; Icon: LucideIcon }[] = [
  { href: "/organizer/inbox", title: "受信箱", desc: "ボランティアとのメッセージ", Icon: Inbox },
  { href: "/organizer/articles", title: "記事", desc: "まちの記事を書く・管理する", Icon: BookOpen },
  { href: "/organizer/stories", title: "ストーリー", desc: "活動の様子を短く届ける", Icon: Sparkles },
  {
    href: "/organizer/settings/payouts",
    title: "売上の受け取り",
    desc: "振込先・入金の確認",
    Icon: Landmark,
  },
];

/** 主催者：運営ツール（見本「04_運営」） */
export default function OrganizerToolsPage() {
  return (
    <OrganizerRegistrationGate>
      <div className="mx-auto w-full max-w-xl space-y-5 pb-6">
        <OrganizerPageTitle
          title="運営ツール"
          subtitle="データ・販売・ゲーム・契約を管理"
          Icon={LayoutGrid}
        />

        <section className="relative overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(22,56,40,0.16)]">
          {/* ツールが画面の下に押し出されないよう低めにする */}
          <div className="relative h-[120px] w-full">
            <Image src="/hero-festival.jpg" alt="" fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#123524]/90 via-[#123524]/55 to-transparent" aria-hidden />
            <div className="absolute inset-0 flex flex-col justify-center px-5 text-white">
              <p className="text-[11px] font-medium tracking-[0.18em] text-white/85">ORGANIZER TOOLS</p>
              <p
                className="mt-1 text-[19px] font-bold leading-[1.35]"
                style={{ fontFamily: "var(--font-serif-display), 'Noto Serif JP', serif" }}
              >
                地域の活動を、
                <br />
                もっとスムーズに。
              </p>
            </div>
          </div>
        </section>

        {/* イベント当日にいちばん使うので、いちばん上に置く */}
        <Link
          href="/organizer"
          className="flex items-center gap-3 rounded-[20px] bg-gradient-to-b from-[#2f7d4e] to-[#1f6a42] p-4 text-white shadow-[0_6px_16px_rgba(22,56,40,0.22)] transition active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/95 text-[#1f6a42]" aria-hidden>
            <QrCode className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold">当日の運営</span>
            <span className="mt-0.5 block text-[12.5px] text-white/85">チェックイン・スタッフ受付</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
        </Link>

        <ul className="grid grid-cols-2 gap-3">
          {MAIN_TOOLS.map(({ href, title, desc, Icon, color, bg }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full min-h-[140px] flex-col rounded-[22px] border border-[#ebeee8] p-4 shadow-[0_3px_10px_rgba(22,56,40,0.05)] transition active:scale-[0.98]"
                style={{ background: bg }}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_8px_rgba(22,56,40,0.06)]"
                  style={{ color }}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-3 text-[18px] font-bold" style={{ color }}>
                  {title}
                </span>
                <span className="mt-1 text-[12.5px] text-[#6b776f]">{desc}</span>
                <ChevronRight className="mt-auto h-5 w-5 self-end text-[#163828]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <section aria-labelledby="more-tools" className="space-y-2">
          <h2 id="more-tools" className="text-[15px] font-bold text-[#163828]">
            そのほかの機能
          </h2>
          <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[20px] border border-[#ebeee8] bg-white">
            {MORE_TOOLS.map(({ href, title, desc, Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-[#fafcf9]">
                  <Icon className="h-5 w-5 shrink-0 text-[#2f7d4e]" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-[#163828]">{title}</span>
                    <span className="block text-[12px] text-[#6b776f]">{desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#8a958d]" aria-hidden />
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-3 px-4 py-3.5 text-[#8a958d]">
              <UserPlus className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold">チーム・招待</span>
                <span className="block text-[12px]">メンバーと一緒に運営（TEAMプラン・準備中）</span>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </OrganizerRegistrationGate>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Gamepad2,
  Inbox,
  LayoutGrid,
  QrCode,
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

/**
 * よく使う3つ（横並び）。
 * プラン・売上の受け取りはマイページにあるので、ここには置かない（入口は1か所にする）
 */
const MAIN_TOOLS: Tool[] = [
  {
    href: "/organizer/events",
    title: "イベント管理",
    desc: "申込・公開・募集",
    Icon: CalendarDays,
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
];

/** そのほかの機能（スマホの上のタブ帯をなくしたので、ここから行けるようにする） */
const MORE_TOOLS: { href: string; title: string; desc: string; Icon: LucideIcon }[] = [
  { href: "/messages", title: "メッセージ", desc: "参加者・ボランティアとのやりとり", Icon: Inbox },
  // 記事・ストーリーは保存先がサーバーのメモリだけ（lib/read-articles-store・lib/stories-store）で、
  // 書いても消え、書いた人も「地域振興会」に固定されるため、データベースに保存できるまで入口を出さない
];

/** 主催者：運営ツール（見本「04_運営」） */
export default function OrganizerToolsPage() {
  return (
    <OrganizerRegistrationGate>
      <div className="mx-auto w-full max-w-xl space-y-5 pb-6 tablet:max-w-[720px]">
        <OrganizerPageTitle
          title="運営ツール"
          subtitle="当日の受付・レジ・ゲームなど、イベントを動かす道具"
          Icon={LayoutGrid}
        />

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

        <ul className="grid grid-cols-3 gap-2.5">
          {MAIN_TOOLS.map(({ href, title, desc, Icon, color, bg }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full flex-col items-center rounded-[20px] border border-[#ebeee8] px-2 py-3.5 text-center shadow-[0_3px_10px_rgba(22,56,40,0.05)] transition active:scale-[0.98]"
                style={{ background: bg }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white shadow-[0_2px_8px_rgba(22,56,40,0.06)]"
                  style={{ color }}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-2 text-[14px] font-bold" style={{ color }}>
                  {title}
                </span>
                <span className="mt-0.5 text-[11px] leading-snug text-[#6b776f]">{desc}</span>
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

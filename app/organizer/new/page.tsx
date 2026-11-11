import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Gamepad2,
  Heart,
  Plus,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerPageTitle } from "@/components/organizer/mobile/OrganizerPageTitle";

export const metadata: Metadata = {
  title: "新しく掲載する | MachiGlyph",
};

type Kind = {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  /** アイコンの色と、その下地の色 */
  color: string;
  bg: string;
};

const KINDS: Kind[] = [
  {
    href: "/organizer/events/new",
    title: "イベントを掲載",
    desc: "お祭り・マルシェ・講座など",
    Icon: CalendarDays,
    color: "#2f7d4e",
    bg: "#e6f3ea",
  },
  {
    href: "/organizer/stores/new",
    title: "お店を掲載",
    desc: "カフェ・飲食店・商店など",
    Icon: Store,
    color: "#b07a1c",
    bg: "#fdf3dc",
  },
  {
    href: "/organizer/kitchen-cars/new",
    title: "キッチンカーを掲載",
    desc: "出店情報・メニュー・スケジュール",
    Icon: Truck,
    color: "#2f7ab0",
    bg: "#e6f1fa",
  },
  {
    href: "/organizer/recruitments/new",
    title: "ボランティアを募集",
    desc: "活動・スタッフ募集",
    Icon: Heart,
    color: "#d0567a",
    bg: "#fde9ef",
  },
  {
    href: "/organizer/games/new",
    title: "ゲームを作成",
    desc: "スタンプ・クイズ・フォトラリー",
    Icon: Gamepad2,
    color: "#7a5cc0",
    bg: "#efeaf9",
  },
];

/** 主催者：新しく掲載する（見本「06_新規掲載」）。何を載せるかを選んで、それぞれの作成画面へ進む */
export default function OrganizerNewListingPage() {
  return (
    <OrganizerRegistrationGate>
      <div className="mx-auto w-full max-w-xl space-y-5 pb-6">
        <OrganizerPageTitle title="新しく掲載する" subtitle="掲載したい情報の種類を選択" Icon={Plus} />

        <p className="rounded-[18px] border border-[#d9eadf] bg-gradient-to-br from-[#eef7f0] to-[#f8fbf5] px-5 py-4 text-[14px] leading-[1.8] text-[#3f5146]">
          イベントからお店、ボランティアまで。
          <br />
          地域に届けたい情報を登録しましょう。
        </p>

        <section aria-labelledby="new-listing-kinds" className="space-y-3">
          <h2 id="new-listing-kinds" className="text-[17px] font-bold text-[#163828]">
            掲載する内容を選ぶ
          </h2>
          <ul className="space-y-3">
            {KINDS.map(({ href, title, desc, Icon, color, bg }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-4 rounded-[20px] border border-[#ebeee8] bg-white p-3 pr-4 shadow-[0_3px_10px_rgba(22,56,40,0.05)] transition active:scale-[0.99] active:bg-[#fafcf9]"
                >
                  <span
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px]"
                    style={{ background: bg, color }}
                    aria-hidden
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold text-[#163828]">{title}</span>
                    <span className="mt-1 block text-[12.5px] text-[#6b776f]">{desc}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#163828]" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </OrganizerRegistrationGate>
  );
}

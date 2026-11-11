"use client";

import Link from "next/link";
import {
  ChevronRight,
  Crown,
  HelpCircle,
  Landmark,
  Pencil,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OrganizerPageTitle } from "@/components/organizer/mobile/OrganizerPageTitle";
import { cn } from "@/lib/utils";

export type OrganizerSettingsMobileViewProps = {
  planLabel: string;
  slots: string;
  receiving: string | null;
  displayEmail: string;
  displayName: string;
  organizationName: string;
  contactVal: string;
  orgLoading: boolean;
  billingLoading: boolean;
};

type Row = {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  badge?: { label: string; tone: "ok" | "warn" };
};

/** 主催者マイページ（スマホ、見本「05_マイページ」） */
export function OrganizerSettingsMobileView({
  planLabel,
  slots,
  receiving,
  displayEmail,
  displayName,
  organizationName,
  contactVal,
  orgLoading,
  billingLoading,
}: OrganizerSettingsMobileViewProps) {
  const orgName = organizationName || (orgLoading ? "" : "団体名が未設定です");
  // 団体名・表示名がないとき（「—」になっているときも）は「主」にする
  const nameForInitial = [organizationName, displayName].find((v) => v && v.trim() && v.trim() !== "—");
  const initial = (nameForInitial ?? "主").trim().charAt(0).toUpperCase();

  const rows: Row[] = [
    {
      href: "/organizer/settings/profile",
      title: "団体・主催者情報",
      desc: orgLoading ? "読み込み中..." : `問い合わせ先：${contactVal}`,
      Icon: Users,
      color: "#2f7d4e",
      bg: "#e6f3ea",
    },
    {
      href: "/organizer/settings/plan",
      title: "ご利用プラン",
      desc: "契約・お支払いの確認",
      Icon: Crown,
      color: "#b07a1c",
      bg: "#fdf3dc",
    },
    {
      href: "/organizer/settings/payouts",
      title: "売上の受け取り",
      desc: "カード売上を口座で受け取る（プランとは別）",
      Icon: Landmark,
      color: "#d0567a",
      bg: "#fde9ef",
      badge: billingLoading
        ? undefined
        : receiving === "設定済み"
          ? { label: "設定済み", tone: "ok" }
          : { label: receiving ?? "未設定", tone: "warn" },
    },
    {
      href: "/profile/edit",
      title: "アカウント情報",
      desc: `ログイン中：${displayEmail}`,
      Icon: UserRound,
      color: "#2f6fae",
      bg: "#e6f1fa",
    },
    {
      href: "/profile/edit",
      title: "ログイン・セキュリティ",
      desc: "パスワード・ログアウト",
      Icon: ShieldCheck,
      color: "#6b5a3a",
      bg: "#f3eee5",
    },
    {
      href: "/contact",
      title: "ヘルプ・お問い合わせ",
      desc: "困ったときはこちら",
      Icon: HelpCircle,
      color: "#5f6d64",
      bg: "#eef1ec",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 pb-4 min-[900px]:hidden">
      <OrganizerPageTitle title="マイページ" subtitle="主催団体とアカウントの設定" Icon={Settings} />

      {/* 団体のカード */}
      <section className="rounded-[22px] border border-[#ebeee8] bg-white p-4 shadow-[0_3px_10px_rgba(22,56,40,0.05)]">
        <div className="flex items-center gap-3">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#2f7d4e] text-[24px] font-bold text-white ring-4 ring-[#e6f3ea]"
            style={{ fontFamily: "var(--font-serif-display), 'Noto Serif JP', serif" }}
            aria-hidden
          >
            {initial}
          </span>
          <div className="min-w-0">
            {orgLoading ? (
              <div className="h-6 w-32 animate-pulse rounded bg-[#e8ede4]" />
            ) : (
              <p className="truncate text-[20px] font-bold text-[#163828]">{orgName}</p>
            )}
            <p className="mt-0.5 text-[13px] text-[#6b776f]">主催者アカウント</p>
          </div>
        </div>
        <Link
          href="/organizer/settings/profile"
          className="mt-4 flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#cfe3d6] bg-[#f1f8f3] text-[15px] font-bold text-[#1f6a42] active:scale-[0.99]"
        >
          プロフィールを編集
          <Pencil className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      {/* 現在のプラン */}
      <Link
        href="/organizer/settings/plan"
        className="flex items-center gap-3 rounded-[20px] border border-[#f0dfb6] bg-[#fffaf0] px-4 py-3.5 active:scale-[0.99]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdf0cf] text-[#b07a1c]" aria-hidden>
          <Crown className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] text-[#8a7650]">現在のプラン</span>
          {billingLoading ? (
            <span className="mt-1 block h-6 w-28 animate-pulse rounded bg-[#f3e6c4]" />
          ) : (
            <>
              <span className="block truncate text-[20px] font-bold text-[#3a2c10]">{planLabel}</span>
              <span className="block truncate text-[12px] font-bold text-[#4a8a2e]">{slots}</span>
            </>
          )}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#3a2c10]" aria-hidden />
      </Link>

      {/* アカウント・団体管理 */}
      <section aria-labelledby="org-account-heading" className="space-y-2.5">
        <h2 id="org-account-heading" className="text-[18px] font-bold text-[#163828]">
          アカウント・団体管理
        </h2>
        <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[22px] border border-[#ebeee8] bg-white">
          {rows.map(({ href, title, desc, Icon, color, bg, badge }) => (
            <li key={title}>
              <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-[#fafcf9]">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{ background: bg, color }}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-[#163828]">{title}</span>
                    {badge ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                          badge.tone === "ok" ? "bg-[#e3f2e7] text-[#1f7a4a]" : "bg-[#fde9ef] text-[#b84060]"
                        )}
                      >
                        {badge.label}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-[#6b776f]">{desc}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#163828]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Megaphone, Sparkles, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import OrganizerDashboardClient from "@/components/organizer/OrganizerDashboardClient";
import { getOrganizerNavState } from "@/lib/organizer/get-organizer-nav-state";

function BenefitCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[var(--mg-shadow)] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-900">{title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function OrganizerPage() {
  const { supabase, organizerRegistered } = await getOrganizerNavState();
  if (!supabase) {
    return (
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-5 py-5 text-sm text-amber-900">
        <p className="font-medium">データベースに接続できません。</p>
        <p className="mt-1 text-xs text-amber-800">
          しばらく時間をおいてから再度お試しください。
        </p>
      </div>
    );
  }

  if (organizerRegistered) {
    return <OrganizerDashboardClient />;
  }

  return (
    <div className="mx-auto max-w-lg pb-10 sm:max-w-2xl">
      {/* ファーストビュー */}
      <header className="sm:text-center">
        <h1 className="text-pretty text-[26px] font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl sm:leading-tight">
          活動者登録をはじめる
        </h1>
        <div className="mt-4 space-y-2 text-[15px] leading-relaxed text-slate-600 sm:mx-auto sm:max-w-md">
          <p>個人でも団体でも登録できます。</p>
          <p>イベントや地域活動の作成・募集管理を始められます。</p>
          <p className="text-[14px] text-slate-500">地域活動をこれから始める方も歓迎です。</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:mx-auto sm:max-w-md sm:flex-row sm:justify-center">
          <Link
            href="/organizer/register"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-[16px] font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            活動者登録をはじめる
          </Link>
          <Link
            href="/organizer/settings/plan"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-5 py-3 text-[15px] font-medium text-slate-700 transition hover:bg-slate-50"
          >
            プラン・機能を見る
          </Link>
        </div>

        <p className="mt-6 text-center sm:max-w-md sm:mx-auto">
          <Link
            href="/events"
            className="text-[14px] font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
          >
            あとで見る（イベントを探す）
          </Link>
        </p>
      </header>

      <section className="mt-10 space-y-4 sm:mt-12 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
        <BenefitCard
          title="イベントを掲載できる"
          description="内容を入力して公開すれば、参加者に見つけてもらえます。"
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
        />
        <BenefitCard
          title="スタッフ募集ができる"
          description="必要な役割を募集して、運営をスムーズに進められます。"
          icon={<UsersRound className="h-5 w-5" aria-hidden />}
        />
        <BenefitCard
          title="地域の活動を発信できる"
          description="記事投稿で取り組みや想いを丁寧に伝えられます。"
          icon={<Megaphone className="h-5 w-5" aria-hidden />}
        />
      </section>
    </div>
  );
}

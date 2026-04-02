import Link from "next/link";
import { Megaphone, Sparkles, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import OrganizerDashboardClient from "@/components/organizer/OrganizerDashboardClient";

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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function OrganizerPage() {
  const supabase = await createClient();
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const organizerRegistered = await (async () => {
    if (!user) return false;
    const { data } = await supabase
      .from("organizers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    return !!data;
  })();

  if (organizerRegistered) {
    return <OrganizerDashboardClient />;
  }

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 25%, var(--mg-accent, #f59e0b) 0%, transparent 55%), radial-gradient(circle at 85% 75%, #60a5fa 0%, transparent 50%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
            はじめての主催者ページ
            <span className="inline-block h-1 w-1 rounded-full bg-amber-400" />
            数分で完了
          </p>

          <h1 className="mt-4 text-balance text-2xl font-bold text-slate-900 sm:text-3xl">
            <span className="block sm:inline">主催者登録をして、</span>
            <span className="block sm:inline">イベントを掲載しましょう</span>
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            MachiGlyphでは、主催者登録を完了するとイベント作成・スタッフ募集・記事投稿などの機能をご利用いただけます。
          </p>

          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/organizer/register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[var(--mg-accent,theme(colors.amber.600))] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              主催者登録をはじめる
            </Link>
            <Link
              href="/organizer/settings/plan"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              料金プランを見る
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-2 text-left text-sm text-slate-600 sm:mx-auto sm:max-w-md">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>登録は数分で完了</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>登録後すぐにイベント作成を開始可能</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>無料プランから利用可能</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/events"
              className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              イベントを探すページへ戻る
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
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

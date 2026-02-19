import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { mockRecruitments } from "@/lib/recruitments-mock";
import type { Recruitment } from "@/lib/db/recruitments";

type Props = {
  params: Promise<{ id: string }>;
};

function getRecruitment(id: string): Recruitment | null {
  return mockRecruitments.find((r) => r.id === id) ?? null;
}

const TYPE_LABELS: Record<string, string> = {
  volunteer: "ボランティア",
  paid_spot: "謝礼あり",
  job: "求人",
  tech_volunteer: "テックボランティア",
};

export default async function RecruitmentDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  const r = getRecruitment(id);
  if (!r) notFound();

  const shortTitle =
    r.title.length > 24 ? `${r.title.slice(0, 24)}…` : r.title;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "募集一覧", href: "/recruitments" },
              { label: shortTitle },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-2xl border border-zinc-200/60 bg-white/95 p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/95">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {TYPE_LABELS[r.type] ?? r.type}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {r.title}
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            {r.description}
          </p>

          <dl className="mt-6 space-y-4">
            {r.role && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">役割</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">{r.role}</dd>
              </div>
            )}
            {r.time_slot && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">時間帯</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.time_slot}
                </dd>
              </div>
            )}
            {r.compensation_type && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">報酬</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.compensation_type}
                  {r.compensation_note && (
                    <span className="ml-1 text-sm text-zinc-500">
                      （{r.compensation_note}）
                    </span>
                  )}
                </dd>
              </div>
            )}
            {r.pay_type && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">謝礼</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.pay_type}
                  {r.pay_amount != null && (
                    <span className="ml-1">¥{r.pay_amount.toLocaleString()}</span>
                  )}
                </dd>
              </div>
            )}
            {r.work_hours && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">勤務時間</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.work_hours}
                </dd>
              </div>
            )}
            {r.work_content && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">業務内容</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.work_content}
                </dd>
              </div>
            )}
            {r.employer_name && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">雇用者</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.employer_name}
                </dd>
              </div>
            )}
            {r.deliverable_scope && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">納品範囲</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {r.deliverable_scope}
                </dd>
              </div>
            )}
          </dl>
        </article>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Recruitment = {
  id: string;
  type: string;
  title: string;
  description: string;
  role?: string;
  pay_amount?: number;
  pay_type?: string;
  tech_slot?: string;
  events?: { title: string; date: string } | null;
  organizers?: { organization_name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  volunteer: "ボランティア",
  paid_spot: "有償スポット",
  job: "求人",
  tech_volunteer: "技術ボランティア",
};

export default function RecruitmentsPage() {
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recruitments")
      .then((r) => r.json())
      .then((data) => setRecruitments(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="text-sm text-zinc-500 hover:underline">← トップへ</Link>
          <h1 className="mt-2 text-2xl font-bold">募集一覧</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <p className="text-zinc-500">読み込み中...</p>
        ) : (
          <ul className="space-y-4">
            {recruitments.length === 0 ? (
              <li className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                募集はありません
              </li>
            ) : (
              recruitments.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/recruitments/${r.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
                      {TYPE_LABELS[r.type] ?? r.type}
                    </span>
                    <h2 className="mt-2 font-semibold">{r.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{r.description}</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {typeof r.events === "object" && r.events?.title
                        ? `${r.events.title}`
                        : null}
                      {typeof r.organizers === "object" && r.organizers?.organization_name
                        ? ` · ${r.organizers.organization_name}`
                        : ""}
                    </p>
                    {r.pay_amount && (
                      <p className="mt-1 text-sm font-medium">
                        {r.pay_type} ¥{r.pay_amount}
                      </p>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="mt-8">
          <Link href="/organizer/recruitments" className="text-sm text-zinc-500 underline hover:text-zinc-700">
            主催者向け：募集管理 →
          </Link>
        </div>
      </main>
    </div>
  );
}

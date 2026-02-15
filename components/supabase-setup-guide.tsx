"use client";

import Link from "next/link";

type Props = {
  backHref: string;
  backLabel?: string;
};

export function SupabaseSetupGuide({ backHref, backLabel = "← 戻る" }: Props) {
  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-zinc-200/60 bg-white/90 p-6 dark:border-zinc-700/60 dark:bg-zinc-900/90">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">
        Supabase が設定されていません
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        チャット機能を利用するには、Supabase の設定が必要です。
      </p>
      <details className="rounded-lg border border-zinc-200/60 bg-zinc-50/80 dark:border-zinc-700/60 dark:bg-zinc-800/50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          セットアップ手順
        </summary>
        <ol className="list-inside list-decimal space-y-2 px-4 pb-4 pt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline underline-offset-2 hover:opacity-80"
            >
              Supabase
            </a>
            でプロジェクトを作成
          </li>
          <li>
            ダッシュボードの <strong>Settings → API</strong> から URL と anon key
            を取得
          </li>
          <li>
            プロジェクトルートに <code className="rounded bg-zinc-200/80 px-1 py-0.5 dark:bg-zinc-700">.env.local</code>{" "}
            を作成し、以下を記述:
          </li>
        </ol>
        <pre className="mx-4 mb-4 overflow-x-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-100">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <p className="px-4 pb-4 text-sm text-zinc-600 dark:text-zinc-400">
          4. README の「マイグレーション実行」に従い、SQL を実行
          <br />
          5. 開発サーバーを再起動
        </p>
      </details>
      <Link
        href={backHref}
        className="block text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {backLabel}
      </Link>
    </div>
  );
}

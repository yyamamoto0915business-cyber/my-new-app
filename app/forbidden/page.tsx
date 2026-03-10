import Link from "next/link";

export const metadata = {
  title: "アクセス権限がありません | MachiGlyph",
  description: "このページにアクセスする権限がありません。",
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          このページにアクセスする権限がありません
        </h1>
        <p className="text-sm text-slate-600">
          ご指定のページは開発者専用の管理画面です。
          一般ユーザーや主催者アカウントではアクセスできません。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-[var(--mg-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}

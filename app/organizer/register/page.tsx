"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type RegisterAs = "individual" | "organization";

export default function OrganizerRegisterPage() {
  const router = useRouter();
  const [registerAs, setRegisterAs] = useState<RegisterAs>("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [activityArea, setActivityArea] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameLabel = registerAs === "individual" ? "お名前・活動名" : "団体名";
  const namePlaceholder =
    registerAs === "individual"
      ? "例：山田太郎 / まち歩きクラブ"
      : "例：地域振興会 / ○○実行委員会";
  const nameHint =
    registerAs === "individual"
      ? "個人の方は、お名前または活動名で登録できます。"
      : "団体・サークル・任意団体などの名称で登録できます。";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/organizer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: organizationName.trim(),
          contactEmail: contactEmail.trim() || undefined,
          activityArea: activityArea.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "登録に失敗しました");
      router.refresh();
      router.push("/organizer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-2 min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100";

  const labelClass = "text-[15px] font-medium text-slate-800";

  const formId = "organizer-register-form";

  return (
    <div className="relative mx-auto max-w-lg pb-6 mb-20 sm:mb-0 sm:pb-10">
      {/* 見出し（サブヘッダーに「主催者向け」はレイアウト側） */}
      <header className="mb-8 sm:mb-10">
        <h1 className="text-pretty text-[26px] font-bold leading-snug tracking-tight text-slate-900 sm:text-[28px]">
          活動者登録をはじめる
        </h1>
        <div className="mt-4 space-y-2 text-[14px] leading-relaxed text-slate-600 sm:text-[15px]">
          <p>個人でも団体でも登録できます。</p>
          <p>イベントや地域活動の作成・募集管理を始めるための登録です。</p>
        </div>
      </header>

      {/* 登録種別：横並びカード */}
      <section className="mb-8" aria-labelledby="register-kind-heading">
        <h2 id="register-kind-heading" className="text-[13px] font-medium text-slate-500">
          登録のしかた
        </h2>
        <div
          role="radiogroup"
          aria-label="登録種別"
          className="mt-3 grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={registerAs === "individual"}
            onClick={() => setRegisterAs("individual")}
            className={cn(
              "flex min-h-[76px] flex-col justify-center rounded-2xl border-2 px-3 py-3 text-left transition-all touch-manipulation sm:min-h-[84px] sm:px-4",
              registerAs === "individual"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--mg-shadow)]"
                : "border-slate-200/90 bg-white hover:border-slate-300"
            )}
          >
            <span className="flex items-center gap-2">
              <User
                className={cn(
                  "h-4 w-4 shrink-0",
                  registerAs === "individual" ? "text-[var(--accent)]" : "text-slate-500"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[14px] sm:text-[15px]",
                  registerAs === "individual" ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                )}
              >
                個人として登録
              </span>
            </span>
            <span className="mt-2 text-[12px] leading-snug text-slate-600">
              個人名・活動名で始める
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={registerAs === "organization"}
            onClick={() => setRegisterAs("organization")}
            className={cn(
              "flex min-h-[76px] flex-col justify-center rounded-2xl border-2 px-3 py-3 text-left transition-all touch-manipulation sm:min-h-[84px] sm:px-4",
              registerAs === "organization"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--mg-shadow)]"
                : "border-slate-200/90 bg-white hover:border-slate-300"
            )}
          >
            <span className="flex items-center gap-2">
              <Building2
                className={cn(
                  "h-4 w-4 shrink-0",
                  registerAs === "organization" ? "text-[var(--accent)]" : "text-slate-500"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[14px] sm:text-[15px]",
                  registerAs === "organization" ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                )}
              >
                団体として登録
              </span>
            </span>
            <span className="mt-2 text-[12px] leading-snug text-slate-600">
              団体・サークル向け
            </span>
          </button>
        </div>
      </section>

      <form id={formId} onSubmit={handleSubmit} className="space-y-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--mg-shadow)] sm:p-6">
          <h2 className="text-[17px] font-semibold text-slate-900 sm:text-lg">
            入力内容
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            必須は表示名のみです。ほかはあとから設定でも構いません。
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="organizationName" className={labelClass}>
                {nameLabel}
                <span className="ml-1 text-red-600">*</span>
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                placeholder={namePlaceholder}
                className={inputClass}
                autoComplete="name"
              />
              <p className="mt-2 text-[12px] leading-relaxed text-slate-500">{nameHint}</p>
            </div>

            <div>
              <label htmlFor="contactEmail" className={labelClass}>
                連絡先メール
                <span className="ml-1 text-[13px] font-normal text-slate-500">（任意）</span>
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="例：info@example.com"
                className={inputClass}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="activityArea" className={labelClass}>
                活動エリア
                <span className="ml-1 text-[13px] font-normal text-slate-500">（任意）</span>
              </label>
              <input
                id="activityArea"
                type="text"
                value={activityArea}
                onChange={(e) => setActivityArea(e.target.value)}
                placeholder="例：東京都世田谷区 / オンライン"
                className={inputClass}
              />
              <p className="mt-2 text-[12px] text-slate-500">
                主に活動する地域や範囲があれば入力してください。
              </p>
            </div>

            <div>
              <label htmlFor="bio" className={labelClass}>
                紹介文
                <span className="ml-1 text-[13px] font-normal text-slate-500">（任意）</span>
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="活動の内容や想いを短く入力できます（公開プロフィールに反映されます）"
                className={cn(inputClass, "min-h-[120px] resize-y py-3")}
              />
            </div>
          </div>

          <p className="mt-6 text-[12px] leading-relaxed text-slate-500">
            連絡先は必要なご案内にだけ使います。
          </p>

          {error && (
            <p className="mt-6 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* デスクトップ CTA */}
          <div className="mt-8 hidden flex-col gap-4 border-t border-slate-100 pt-8 sm:flex">
            <div className="flex flex-row-reverse flex-wrap justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[52px] min-w-[180px] items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-[15px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "送信中…" : "登録を進める"}
              </button>
              <Link
                href="/organizer"
                className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                あとで入力する
              </Link>
            </div>
            <Link
              href="/organizer/settings/plan"
              className="inline-flex w-fit text-[14px] font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              主催者について詳しく見る
            </Link>
          </div>
        </div>

        <div className="h-32 sm:hidden" aria-hidden />
      </form>

      {/* スマホ固定 CTA（下部ナビの上） */}
      <div
        className="fixed inset-x-0 z-40 border-t border-slate-200/80 bg-[var(--mg-paper)]/96 px-5 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.06)] backdrop-blur-md sm:hidden"
        style={{
          bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          type="submit"
          form={formId}
          disabled={loading}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--accent)] text-[16px] font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? "送信中…" : "登録を進める"}
        </button>
        <div className="mt-2 flex flex-col items-center gap-1.5 text-center">
          <Link
            href="/organizer"
            className="text-[14px] font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            あとで入力する
          </Link>
          <Link
            href="/organizer/settings/plan"
            className="text-[13px] text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
          >
            主催者について詳しく見る
          </Link>
        </div>
      </div>
    </div>
  );
}

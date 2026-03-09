"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RegisterAs = "individual" | "organization";

export default function OrganizerRegisterPage() {
  const router = useRouter();
  const [registerAs, setRegisterAs] = useState<RegisterAs>("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameLabel = registerAs === "individual" ? "お名前・活動名 *" : "団体名 *";
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
          contactPhone: contactPhone.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "登録に失敗しました");
      router.push("/organizer/events");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <div className="min-h-screen bg-[var(--mg-paper)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:border-zinc-700 dark:bg-zinc-900/95 dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        {/* タイトル・説明 */}
        <div>
          <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            団体未所属でも利用できます
          </span>
          <h1 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            活動者登録
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            団体でも個人でも登録できます。イベントや地域活動の作成・募集管理を始めるための登録です。
          </p>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            地域活動をこれから始める方も歓迎です。
          </p>
        </div>

        {/* 登録種別 */}
        <div className="mt-8">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            登録種別
          </p>
          <div
            role="group"
            aria-label="登録種別"
            className="inline-flex w-full rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-600 dark:bg-zinc-800/50"
          >
            <button
              type="button"
              onClick={() => setRegisterAs("individual")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
                registerAs === "individual"
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              個人として登録
            </button>
            <button
              type="button"
              onClick={() => setRegisterAs("organization")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
                registerAs === "organization"
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              団体として登録
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="organizationName"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              {nameLabel}
            </label>
            <input
              id="organizationName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
              placeholder={namePlaceholder}
              className={inputBase}
            />
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {nameHint}
            </p>
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              連絡先メール
              <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                （任意）
              </span>
            </label>
            <input
              id="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="例：info@example.com"
              className={inputBase}
            />
          </div>

          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              電話番号
              <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                （任意）
              </span>
            </label>
            <input
              id="contactPhone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="例：03-1234-5678"
              className={inputBase}
            />
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            連絡先は、必要なご案内のために利用します。
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Link
              href="/organizer/events"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 min-h-[44px]"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 min-h-[44px] touch-manipulation"
            >
              {loading ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

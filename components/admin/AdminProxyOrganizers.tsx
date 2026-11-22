"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Pencil, Plus, Link2, UserRound } from "lucide-react";
import { AdminProxyProfileEditor } from "@/components/admin/AdminProxyProfileEditor";

type Row = {
  organizerId: string;
  name: string;
  contactNote: string | null;
  createdAt: string;
  claimedAt: string | null;
  linkExpiresAt: string | null;
  hasLink: boolean;
  stores: number;
  events: number;
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

/** 管理者画面：代わりに作る主催者ページの一覧・作成・編集への切りかえ・受け取りリンク */
export function AdminProxyOrganizers() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [openProfile, setOpenProfile] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/proxy-organizers", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { items?: Row[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "読み込めませんでした");
      setRows([]);
      return;
    }
    setRows(json.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch("/api/admin/proxy-organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contactNote: note }),
      });
      const json = (await res.json().catch(() => ({}))) as { organizerId?: string; error?: string };
      if (!res.ok || !json.organizerId) {
        setError(json.error ?? "作れませんでした");
        return;
      }
      setName("");
      setNote("");
      await load();
    } finally {
      setBusy(null);
    }
  }

  /** 主催者モードで、このページを「使うチーム」にして開く */
  async function edit(organizerId: string) {
    setBusy(`edit:${organizerId}`);
    setError(null);
    try {
      const res = await fetch("/api/organizer/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId }),
      });
      if (!res.ok) {
        setError("このページに切りかえられませんでした");
        return;
      }
      window.location.assign("/organizer/home");
    } finally {
      setBusy(null);
    }
  }

  async function issue(organizerId: string) {
    setBusy(`link:${organizerId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proxy-organizers/${organizerId}/claim-link`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "リンクを作れませんでした");
        return;
      }
      setLinks((m) => ({ ...m, [organizerId]: json.url! }));
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function copy(organizerId: string) {
    const url = links[organizerId];
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(organizerId);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-[#e6e2d6] bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-[#173f2c]">新しく代わりに作る</h2>
        <p className="mb-3 text-xs text-[#6b776f]">
          作ると、あなたがそのページの管理者メンバーになり、「プロフィール」で名前・写真・紹介文を、「主催者モードで作り込む」でお店・キッチンカー・イベントを作れます。
        </p>
        <div className="grid gap-2 min-[768px]:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="団体名・店名（例：まちカフェ）"
            className="h-11 rounded-lg border border-[#d8e4dc] px-3 text-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="メモ（連絡先・Instagram など。運営だけが見る）"
            className="h-11 rounded-lg border border-[#d8e4dc] px-3 text-sm"
          />
          <button
            type="button"
            disabled={!name.trim() || busy === "create"}
            onClick={() => void create()}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#173f2c] px-4 text-sm font-bold text-[#f6ebc8] disabled:opacity-50"
          >
            {busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
            作る
          </button>
        </div>
        {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border border-[#e6e2d6] bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-[#173f2c]">代わりに作った主催者ページ</h2>
        {rows === null ? (
          <p className="text-sm text-[#6b776f]">読み込んでいます…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#6b776f]">まだありません。</p>
        ) : (
          <ul className="divide-y divide-[#eef4f0]">
            {rows.map((r) => (
              <li key={r.organizerId} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#163828]">{r.name}</p>
                  {r.claimedAt ? (
                    <span className="rounded-full bg-[#e6f4ea] px-2 py-0.5 text-xs font-bold text-[#1f6a42]">受け取り済み {fmt(r.claimedAt)}</span>
                  ) : r.hasLink ? (
                    <span className="rounded-full bg-[#fff6e2] px-2 py-0.5 text-xs font-bold text-[#8a6d1f]">リンク発行中（{fmt(r.linkExpiresAt)}まで）</span>
                  ) : (
                    <span className="rounded-full bg-[#f1f1ee] px-2 py-0.5 text-xs font-bold text-[#6b776f]">作り込み中</span>
                  )}
                  <span className="text-xs text-[#6b776f]">
                    お店・キッチンカー {r.stores}・イベント {r.events}
                  </span>
                </div>
                {r.contactNote ? <p className="mt-0.5 text-xs text-[#6b776f]">メモ：{r.contactNote}</p> : null}
                {r.claimedAt ? null : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenProfile((cur) => (cur === r.organizerId ? null : r.organizerId))}
                      aria-expanded={openProfile === r.organizerId}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#c9d8cd] bg-white px-3 text-xs font-bold text-[#173f2c]"
                    >
                      <UserRound className="h-3.5 w-3.5" aria-hidden />
                      プロフィール
                    </button>
                    <button
                      type="button"
                      onClick={() => void edit(r.organizerId)}
                      disabled={busy === `edit:${r.organizerId}`}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#c9d8cd] bg-white px-3 text-xs font-bold text-[#173f2c]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      主催者モードで作り込む
                    </button>
                    <button
                      type="button"
                      onClick={() => void issue(r.organizerId)}
                      disabled={busy === `link:${r.organizerId}`}
                      className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#173f2c] px-3 text-xs font-bold text-[#f6ebc8]"
                    >
                      <Link2 className="h-3.5 w-3.5" aria-hidden />
                      {r.hasLink ? "受け取りリンクを作り直す" : "受け取りリンクを作る"}
                    </button>
                  </div>
                )}
                {!r.claimedAt && openProfile === r.organizerId ? (
                  <AdminProxyProfileEditor organizerId={r.organizerId} onSaved={() => void load()} />
                ) : null}
                {links[r.organizerId] ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#f7f6f2] px-3 py-2">
                    <code className="min-w-0 flex-1 truncate text-xs text-[#163828]">{links[r.organizerId]}</code>
                    <button
                      type="button"
                      onClick={() => void copy(r.organizerId)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#c9d8cd] bg-white px-2 py-1 text-xs font-bold text-[#173f2c]"
                    >
                      {copied === r.organizerId ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                      {copied === r.organizerId ? "コピーしました" : "コピー"}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs leading-relaxed text-[#6b776f]">
          受け取りリンクは7日間・1回だけ使えます。相手がログイン（または登録）して利用規約に同意すると、このページは相手のものになり、運営のメンバーからは外れます。
        </p>
      </section>
    </div>
  );
}

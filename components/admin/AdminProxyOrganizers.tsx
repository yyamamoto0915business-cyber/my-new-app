"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Eye, Loader2, Pencil, Plus, Link2, UserRound } from "lucide-react";
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
  previews: { storeId: string; name: string; status: string; path: string; expiresAt: string }[];
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
  const [showCreate, setShowCreate] = useState(false);

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

  /** 下書きのお店を公開前に見てもらうリンク（PC・スマホ同じリンク。14日間） */
  async function issuePreview(organizerId: string) {
    setBusy(`preview:${organizerId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proxy-organizers/${organizerId}/preview-link`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { links?: { name: string; url: string }[]; error?: string };
      if (!res.ok || !json.links) {
        setError(json.error ?? "プレビューリンクを作れませんでした");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
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

  // 管理者画面は文字をひと回り大きくする設定（.mg-admin）があるので、ここは数字の大きさで指定する
  const btn =
    "inline-flex h-9 min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-[10px] border px-2 text-[12px] font-bold leading-none transition active:scale-[0.97] disabled:opacity-45";

  return (
    <div className="space-y-3">
      {/* 新しく作る：ふだんはボタン1つ。押すと入力欄が開く */}
      <section className="rounded-[14px] border border-[#e6e2d6] bg-white p-3 shadow-sm min-[768px]:p-4">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          aria-expanded={showCreate}
          className="flex w-full items-center gap-2 text-left"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#173f2c] text-[#f6ebc8]">
            <Plus className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-[#173f2c]">新しく代わりに作る</span>
            <span className="block truncate text-[11.5px] text-[#6b776f]">店名を入れると、あなたが管理者メンバーになって作り込めます</span>
          </span>
          <ChevronDown className={`size-4 shrink-0 text-[#8a968c] transition ${showCreate ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {showCreate ? (
          <div className="mt-3 grid gap-2 min-[768px]:grid-cols-[1fr_1fr_auto]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="団体名・店名（例：まちカフェ）"
              className="h-10 rounded-[10px] border border-[#d8e4dc] px-3 text-[16px] min-[768px]:text-[14px]"
            />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="メモ（連絡先・Instagram など。運営だけが見る）"
              className="h-10 rounded-[10px] border border-[#d8e4dc] px-3 text-[16px] min-[768px]:text-[14px]"
            />
            <button
              type="button"
              disabled={!name.trim() || busy === "create"}
              onClick={() => void create()}
              className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#173f2c] px-4 text-[13px] font-bold text-[#f6ebc8] disabled:opacity-50"
            >
              {busy === "create" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              作る
            </button>
          </div>
        ) : null}
        {error ? <p className="mt-2 text-[12.5px] font-bold text-red-600">{error}</p> : null}
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-bold text-[#173f2c]">
          代わりに作った主催者ページ{rows && rows.length > 0 ? `（${rows.length}）` : ""}
        </h2>
        {rows === null ? (
          <p className="px-1 text-[13px] text-[#6b776f]">読み込んでいます…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[#d6ded7] bg-white px-4 py-6 text-center text-[13px] text-[#6b776f]">まだありません。</p>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2.5 min-[1100px]:grid-cols-[repeat(2,minmax(0,1fr))]">
            {rows.map((r) => (
              <li key={r.organizerId} className="min-w-0 overflow-hidden rounded-[14px] border border-[#e6e2d6] bg-white p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 text-[14px] font-bold leading-snug text-[#163828]">{r.name}</p>
                  {r.claimedAt ? (
                    <span className="shrink-0 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10.5px] font-bold text-[#1f6a42]">受け取り済み</span>
                  ) : r.hasLink ? (
                    <span className="shrink-0 rounded-full bg-[#fff6e2] px-2 py-0.5 text-[10.5px] font-bold text-[#8a6d1f]">リンク発行中</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#f1f1ee] px-2 py-0.5 text-[10.5px] font-bold text-[#6b776f]">作り込み中</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11.5px] text-[#6b776f]">
                  お店・キッチンカー {r.stores}・イベント {r.events}
                  {r.claimedAt ? `・${fmt(r.claimedAt)} 受け取り` : r.hasLink ? `・${fmt(r.linkExpiresAt)}まで` : ""}
                  {r.contactNote ? `・${r.contactNote}` : ""}
                </p>

                {r.claimedAt ? null : (
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5 min-[768px]:grid-cols-4 min-[1100px]:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setOpenProfile((cur) => (cur === r.organizerId ? null : r.organizerId))}
                      aria-expanded={openProfile === r.organizerId}
                      className={`${btn} border-[#d8e4dc] bg-white text-[#173f2c]`}
                    >
                      <UserRound className="size-3.5 shrink-0" aria-hidden />
                      プロフィール
                    </button>
                    <button
                      type="button"
                      onClick={() => void edit(r.organizerId)}
                      disabled={busy === `edit:${r.organizerId}`}
                      className={`${btn} border-[#d8e4dc] bg-white text-[#173f2c]`}
                    >
                      <Pencil className="size-3.5 shrink-0" aria-hidden />
                      作り込む
                    </button>
                    <button
                      type="button"
                      onClick={() => void issuePreview(r.organizerId)}
                      disabled={busy === `preview:${r.organizerId}` || r.stores === 0}
                      title={r.stores === 0 ? "お店・キッチンカーを作ると使えます" : "作り直すと前のリンクは使えなくなります"}
                      className={`${btn} border-[#ecdcae] bg-[#fbf5e3] text-[#7a5f1c]`}
                    >
                      <Eye className="size-3.5 shrink-0" aria-hidden />
                      {r.previews?.length ? "プレビュー再発行" : "プレビュー"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void issue(r.organizerId)}
                      disabled={busy === `link:${r.organizerId}`}
                      title="作り直すと前のリンクは使えなくなります"
                      className={`${btn} border-[#173f2c] bg-[#173f2c] text-[#f6ebc8]`}
                    >
                      <Link2 className="size-3.5 shrink-0" aria-hidden />
                      {r.hasLink ? "受け取り再発行" : "受け取りリンク"}
                    </button>
                  </div>
                )}

                {!r.claimedAt && openProfile === r.organizerId ? (
                  <AdminProxyProfileEditor organizerId={r.organizerId} onSaved={() => void load()} />
                ) : null}

                {(r.previews ?? []).map((p, i) => {
                  const url = `${typeof window !== "undefined" ? window.location.origin : ""}${p.path}`;
                  const key = `pv:${r.organizerId}:${i}`;
                  return (
                    <LinkRow
                      key={p.path}
                      tone="gold"
                      label={`プレビュー${(r.previews?.length ?? 0) > 1 ? `：${p.name}` : ""}`}
                      sub={`${p.status === "public" ? "公開中" : "下書き"}・${fmt(p.expiresAt)}まで・PC/スマホ共通`}
                      url={url}
                      openHref={p.path}
                      copied={copied === key}
                      onCopy={() => void copyText(key, url)}
                    />
                  );
                })}
                {links[r.organizerId] ? (
                  <LinkRow
                    tone="green"
                    label="受け取りリンク"
                    sub="7日間・1回だけ"
                    url={links[r.organizerId]!}
                    copied={copied === r.organizerId}
                    onCopy={() => void copy(r.organizerId)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-[14px] border border-[#e6e2d6] bg-white px-3 py-2.5 text-[12px] leading-relaxed text-[#5f6d64]">
        <summary className="cursor-pointer text-[12.5px] font-bold text-[#173f2c]">リンクについて</summary>
        <p className="mt-1.5">プレビューリンクは、公開前のお店を見てもらうためのもので、14日間・何度でも見られます（ログイン不要、検索には出ません）。</p>
        <p className="mt-1">受け取りリンクは7日間・1回だけ使えます。相手がログイン（または登録）して利用規約に同意すると、このページは相手のものになり、運営のメンバーからは外れます。受け取った日から半年、GAMEプランが無料でつきます（期限後は FREE に戻るだけ）。</p>
        <p className="mt-1">どちらも作り直すと、前のリンクは使えなくなります。</p>
      </details>
    </div>
  );
}

function LinkRow({
  tone,
  label,
  sub,
  url,
  openHref,
  copied,
  onCopy,
}: {
  tone: "gold" | "green";
  label: string;
  sub: string;
  url: string;
  openHref?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const box = tone === "gold" ? "border-[#ecdcae] bg-[#fffdf6]" : "border-[#cfe3d6] bg-[#f3f9f5]";
  const head = tone === "gold" ? "text-[#7a5f1c]" : "text-[#1f5e3a]";
  return (
    <div className={`mt-2 min-w-0 rounded-[10px] border px-2.5 py-2 ${box}`}>
      <div className="flex items-center gap-2">
        <p className={`min-w-0 flex-1 truncate text-[11.5px] font-bold ${head}`}>
          {label}
          <span className="ml-1 font-semibold opacity-75">{sub}</span>
        </p>
        {openHref ? (
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="開く"
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[8px] border border-[#d8e4dc] bg-white px-2 text-[11.5px] font-bold text-[#173f2c]"
          >
            <ExternalLink className="size-3" aria-hidden />
            開く
          </a>
        ) : null}
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[8px] border border-[#d8e4dc] bg-white px-2 text-[11.5px] font-bold text-[#173f2c]"
        >
          {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}
          {copied ? "コピー済み" : "コピー"}
        </button>
      </div>
      <code className="mt-1 block truncate text-[11px] text-[#5f6d64]">{url}</code>
    </div>
  );
}

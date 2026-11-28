"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Store,
  UserRound,
} from "lucide-react";
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
  avatarUrl: string | null;
  claimPath: string | null;
  previews: { storeId: string; name: string; status: string; path: string; expiresAt: string }[];
};

type Filter = "all" | "prep" | "sent" | "done";

const SERIF = "var(--font-serif-display), 'Shippori Mincho', serif";

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(new Date(iso));
}

function stageOf(r: Row): Exclude<Filter, "all"> {
  if (r.claimedAt) return "done";
  if (r.hasLink) return "sent";
  return "prep";
}

/** 次にやること（1つだけ大きく出す） */
function nextStep(r: Row): "build" | "preview" | "claim" | "send" | null {
  if (r.claimedAt) return null;
  if (r.stores === 0) return "build";
  if (r.previews.length === 0) return "preview";
  if (!r.hasLink) return "claim";
  return "send";
}

/** 管理者画面：代わりに作る主催者ページの一覧・作成・作り込み・プレビュー・受け取りリンク */
export function AdminProxyOrganizers() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [openProfile, setOpenProfile] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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

  const counts = useMemo(() => {
    const c = { all: 0, prep: 0, sent: 0, done: 0 };
    for (const r of rows ?? []) {
      c.all += 1;
      c[stageOf(r)] += 1;
    }
    return c;
  }, [rows]);
  const shown = (rows ?? []).filter((r) => filter === "all" || stageOf(r) === filter);

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
      setShowCreate(false);
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

  async function issueClaim(organizerId: string) {
    setBusy(`link:${organizerId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proxy-organizers/${organizerId}/claim-link`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "リンクを作れませんでした");
        return;
      }
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
      const json = (await res.json().catch(() => ({}))) as { links?: unknown[]; error?: string };
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

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "すべて" },
    { id: "prep", label: "準備中" },
    { id: "sent", label: "送付中" },
    { id: "done", label: "受け取り済み" },
  ];

  return (
    <div className="space-y-3.5">
      {/* 新しく作る：ふだんは1行。押すと入力欄が開く */}
      <section className="overflow-hidden rounded-[18px] border border-[#ecdcae] bg-gradient-to-br from-[#fffdf6] to-[#fbf3df] shadow-[0_2px_10px_rgba(120,90,30,0.06)]">
        <button type="button" onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[#f6ebc8] shadow-[0_3px_8px_rgba(14,42,29,0.22)]">
            <Plus className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-[#173f2c]">新しく代わりに作る</span>
            <span className="block truncate text-[11.5px] text-[#8a7a55]">店名を入れると、あなたが管理者メンバーになって作り込めます</span>
          </span>
          <ChevronDown className={`size-4 shrink-0 text-[#b0913f] transition ${showCreate ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {showCreate ? (
          <div className="grid gap-2 border-t border-[#f0e4c2] px-4 pb-4 pt-3 min-[768px]:grid-cols-[1fr_1fr_auto]">
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="団体名・店名（例：まちカフェ）" className="h-10 rounded-[10px] border border-[#e6d6a8] bg-white px-3 text-[16px] min-[768px]:text-[14px]" />
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="メモ（連絡先・Instagram など。運営だけが見る）" className="h-10 rounded-[10px] border border-[#e6d6a8] bg-white px-3 text-[16px] min-[768px]:text-[14px]" />
            <button type="button" disabled={!name.trim() || busy === "create"} onClick={() => void create()} className="flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#173f2c] px-5 text-[13px] font-bold text-[#f6ebc8] disabled:opacity-50">
              {busy === "create" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              作る
            </button>
          </div>
        ) : null}
      </section>

      {error ? <p className="rounded-[12px] bg-red-50 px-3 py-2 text-[12.5px] font-bold text-red-700">{error}</p> : null}

      {/* 絞りこみ */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="状態で絞りこむ">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-bold transition ${
              filter === f.id ? "border-[#173f2c] bg-[#173f2c] text-[#f6ebc8]" : "border-[#dfe6e0] bg-white text-[#4f5e55]"
            }`}
          >
            {f.label}
            <span className={`rounded-full px-1.5 text-[10.5px] tabular-nums ${filter === f.id ? "bg-white/15" : "bg-[#f1f3ef] text-[#7a867e]"}`}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="grid gap-2.5 min-[1100px]:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[18px] border border-[#e8ede8] bg-white" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-[#d6ded7] bg-white px-4 py-8 text-center text-[13px] text-[#8a968c]">
          {rows.length === 0 ? "まだありません。上の「新しく代わりに作る」から始めます。" : "この状態のページはありません。"}
        </p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 min-[1100px]:grid-cols-[repeat(2,minmax(0,1fr))]">
          {shown.map((r) => (
            <ProxyCard
              key={r.organizerId}
              r={r}
              origin={origin}
              busy={busy}
              copied={copied}
              profileOpen={openProfile === r.organizerId}
              onToggleProfile={() => setOpenProfile((cur) => (cur === r.organizerId ? null : r.organizerId))}
              onEdit={() => void edit(r.organizerId)}
              onPreview={() => void issuePreview(r.organizerId)}
              onClaim={() => void issueClaim(r.organizerId)}
              onCopy={(key, text) => void copyText(key, text)}
              onSaved={() => void load()}
            />
          ))}
        </ul>
      )}

      <details className="rounded-[14px] border border-[#e6e2d6] bg-white px-3.5 py-2.5 text-[12px] leading-relaxed text-[#5f6d64]">
        <summary className="cursor-pointer text-[12.5px] font-bold text-[#173f2c]">流れとリンクについて</summary>
        <ol className="mt-2 list-decimal space-y-0.5 pl-5">
          <li>作る → 「プロフィール」で名前・写真、「作り込む」でお店を作る</li>
          <li>「プレビュー」を作って、公開前のページを見てもらう（14日間・何度でも・ログイン不要・検索に出ない）</li>
          <li>「受け取りリンク」を送る（7日間・1回だけ）。受け取るとページは相手のものになり、運営はメンバーから外れる</li>
          <li>受け取った日から半年、GAMEプランが無料（期限後は FREE に戻るだけ）</li>
        </ol>
        <p className="mt-1.5">どちらのリンクも、作り直すと前のリンクは使えなくなります。</p>
      </details>
    </div>
  );
}

function ProxyCard({
  r,
  origin,
  busy,
  copied,
  profileOpen,
  onToggleProfile,
  onEdit,
  onPreview,
  onClaim,
  onCopy,
  onSaved,
}: {
  r: Row;
  origin: string;
  busy: string | null;
  copied: string | null;
  profileOpen: boolean;
  onToggleProfile: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onClaim: () => void;
  onCopy: (key: string, text: string) => void;
  onSaved: () => void;
}) {
  const stage = stageOf(r);
  const next = nextStep(r);
  const steps = [
    { label: "作成", done: true },
    { label: "プレビュー", done: r.previews.length > 0 || stage === "done" },
    { label: "リンク送付", done: r.hasLink || stage === "done" },
    { label: "受け取り", done: stage === "done" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const claimUrl = r.claimPath ? `${origin}${r.claimPath}` : null;

  const small =
    "flex h-[52px] min-w-0 flex-col items-center justify-center gap-1 whitespace-nowrap rounded-[12px] border border-[#e1e7e2] bg-white px-1 text-[10.5px] font-bold leading-none text-[#2f4a3b] transition hover:border-[#c9a54e] active:scale-[0.97] disabled:opacity-40";

  const primary = (() => {
    const cls =
      "flex h-11 w-full items-center justify-center gap-1.5 rounded-[12px] border-[1.5px] border-[#d9bc6e] bg-gradient-to-b from-[#245a3e] to-[#173f2c] text-[13.5px] font-bold text-[#f6ebc8] shadow-[0_3px_10px_rgba(14,42,29,0.18)] transition active:scale-[0.98] disabled:opacity-60";
    if (next === "build")
      return (
        <button type="button" onClick={onEdit} disabled={busy === `edit:${r.organizerId}`} className={cls}>
          <Store className="size-4" aria-hidden />
          次へ：お店のページを作る
          <ArrowRight className="size-4" aria-hidden />
        </button>
      );
    if (next === "preview")
      return (
        <button type="button" onClick={onPreview} disabled={busy === `preview:${r.organizerId}`} className={cls}>
          {busy === `preview:${r.organizerId}` ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          次へ：プレビューリンクを作る
        </button>
      );
    if (next === "claim")
      return (
        <button type="button" onClick={onClaim} disabled={busy === `link:${r.organizerId}`} className={cls}>
          {busy === `link:${r.organizerId}` ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
          次へ：受け取りリンクを作る
        </button>
      );
    if (next === "send" && claimUrl)
      return (
        <button type="button" onClick={() => onCopy(`claim:${r.organizerId}`, claimUrl)} className={cls}>
          {copied === `claim:${r.organizerId}` ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied === `claim:${r.organizerId}` ? "コピーしました" : "受け取りリンクをコピーして送る"}
        </button>
      );
    return null;
  })();

  return (
    <li className="min-w-0 overflow-hidden rounded-[18px] border border-[#e3e8e2] bg-white shadow-[0_3px_14px_rgba(22,56,40,0.05)]">
      <div className="p-3.5">
        {/* 見出し：アイコン・名前・状態 */}
        <div className="flex items-start gap-3">
          <span className="relative size-12 shrink-0 overflow-hidden rounded-[14px] border border-[#ecdcae] bg-[#fbf5e3]">
            {r.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-[18px] font-bold text-[#b0913f]" style={{ fontFamily: SERIF }}>
                {r.name.slice(0, 1)}
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#163828]" style={{ fontFamily: SERIF }}>
                {r.name}
              </p>
              {stage === "done" ? (
                <span className="shrink-0 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[10.5px] font-bold text-[#1f6a42]">受け取り済み</span>
              ) : stage === "sent" ? (
                <span className="shrink-0 rounded-full bg-[#fff3d6] px-2 py-0.5 text-[10.5px] font-bold text-[#8a6d1f]">送付中</span>
              ) : (
                <span className="shrink-0 rounded-full bg-[#f1f1ee] px-2 py-0.5 text-[10.5px] font-bold text-[#6b776f]">準備中</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-[11.5px] text-[#7a867e]">
              お店・キッチンカー {r.stores}・イベント {r.events}
              {stage === "done" ? `・${fmt(r.claimedAt)} 受け取り` : `・${fmt(r.createdAt)} 作成`}
            </p>
            {r.contactNote ? <p className="mt-0.5 truncate text-[11.5px] text-[#9a8a62]">メモ：{r.contactNote}</p> : null}
          </div>
        </div>

        {/* 進み具合 */}
        <div className="mt-3">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[#eef1ec]">
            <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#d9bc6e] to-[#2f7d4e] transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-1.5 grid grid-cols-4 text-center">
            {steps.map((s, i) => (
              <li key={s.label} className={`truncate text-[10.5px] font-bold ${s.done ? "text-[#2f6b47]" : i === doneCount ? "text-[#8a6d1f]" : "text-[#b4bdb6]"}`}>
                {s.done ? "✓ " : ""}
                {s.label}
              </li>
            ))}
          </ol>
        </div>

        {/* 次にやること */}
        {primary ? <div className="mt-3">{primary}</div> : null}

        {/* ほかの操作（小さく） */}
        {stage === "done" ? (
          <a href={`/organizers/${r.organizerId}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex h-9 items-center justify-center gap-1 rounded-[10px] border border-[#e1e7e2] text-[12px] font-bold text-[#2f4a3b]">
            <ExternalLink className="size-3.5" aria-hidden />
            公開中の主催者ページを見る
          </a>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-1.5 [&>button>span]:max-w-full [&>button>span]:overflow-hidden [&>button>span]:text-ellipsis">
            <button type="button" onClick={onToggleProfile} aria-expanded={profileOpen} className={`${small} ${profileOpen ? "border-[#c9a54e] bg-[#fffaf0]" : ""}`}>
              <UserRound className="size-4 shrink-0" aria-hidden />
              <span>プロフィール</span>
            </button>
            <button type="button" onClick={onEdit} disabled={busy === `edit:${r.organizerId}`} className={small}>
              <Pencil className="size-4 shrink-0" aria-hidden />
              <span>作り込む</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (r.previews.length && !window.confirm("プレビューリンクを作り直しますか？前のリンクは使えなくなります。")) return;
                onPreview();
              }}
              disabled={busy === `preview:${r.organizerId}` || r.stores === 0}
              title={r.previews.length ? "作り直す（前のリンクは使えなくなります）" : "プレビューリンクを作る"}
              className={small}
            >
              <Eye className="size-4 shrink-0" aria-hidden />
              <span>プレビュー</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (r.hasLink && !window.confirm("受け取りリンクを作り直しますか？前のリンクは使えなくなります。")) return;
                onClaim();
              }}
              disabled={busy === `link:${r.organizerId}`}
              title={r.hasLink ? "作り直す（前のリンクは使えなくなります）" : "受け取りリンクを作る"}
              className={small}
            >
              <Link2 className="size-4 shrink-0" aria-hidden />
              <span>受け取り</span>
            </button>
          </div>
        )}
      </div>

      {profileOpen && stage !== "done" ? (
        <div className="border-t border-[#eef1ec] px-3.5 pb-3.5">
          <AdminProxyProfileEditor organizerId={r.organizerId} onSaved={onSaved} />
        </div>
      ) : null}

      {/* リンク */}
      {stage !== "done" && (r.previews.length > 0 || claimUrl) ? (
        <div className="space-y-1.5 border-t border-[#eef1ec] bg-[#fafbf9] px-3.5 py-3">
          {r.previews.map((p, i) => {
            const url = `${origin}${p.path}`;
            const key = `pv:${r.organizerId}:${i}`;
            return (
              <LinkRow
                key={p.path}
                icon={<Eye className="size-3.5" aria-hidden />}
                tone="gold"
                label={r.previews.length > 1 ? `プレビュー：${p.name}` : "プレビュー"}
                sub={`${p.status === "public" ? "公開中" : "下書き"}・${fmt(p.expiresAt)}まで`}
                url={url}
                openHref={p.path}
                copied={copied === key}
                onCopy={() => onCopy(key, url)}
              />
            );
          })}
          {claimUrl ? (
            <LinkRow
              icon={<Link2 className="size-3.5" aria-hidden />}
              tone="green"
              label="受け取りリンク"
              sub={`${fmt(r.linkExpiresAt)}まで・1回だけ`}
              url={claimUrl}
              copied={copied === `claim:${r.organizerId}`}
              onCopy={() => onCopy(`claim:${r.organizerId}`, claimUrl)}
            />
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function LinkRow({
  icon,
  tone,
  label,
  sub,
  url,
  openHref,
  copied,
  onCopy,
}: {
  icon: React.ReactNode;
  tone: "gold" | "green";
  label: string;
  sub: string;
  url: string;
  openHref?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const chip = tone === "gold" ? "bg-[#fbf0d4] text-[#8a6d1f]" : "bg-[#e3f1e8] text-[#1f5e3a]";
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[12px] border border-[#e6ebe6] bg-white py-1.5 pl-1.5 pr-1.5">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-[9px] ${chip}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-[#163828]">
          {label}
          <span className="ml-1 text-[11px] font-semibold text-[#8a968c]">{sub}</span>
        </p>
        <p className="truncate font-mono text-[10.5px] text-[#8a968c]">{url.replace(/^https?:\/\//, "")}</p>
      </div>
      {openHref ? (
        <a href={openHref} target="_blank" rel="noopener noreferrer" aria-label="開く" className="flex size-8 shrink-0 items-center justify-center rounded-[9px] border border-[#e1e7e2] text-[#2f4a3b]">
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "コピーしました" : "コピー"}
        className={`flex h-8 shrink-0 items-center gap-1 rounded-[9px] px-2.5 text-[11.5px] font-bold ${copied ? "bg-[#e6f4ea] text-[#1f6a42]" : "bg-[#173f2c] text-[#f6ebc8]"}`}
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? "済み" : "コピー"}
      </button>
    </div>
  );
}

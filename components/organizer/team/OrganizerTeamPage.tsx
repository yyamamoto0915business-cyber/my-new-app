"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  Copy,
  Crown,
  Link2,
  Lock,
  PenLine,
  Sparkles,
  UserPlus,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleAtLeast, type OrganizerRole } from "@/lib/organizer/team";

type Member = {
  id: string;
  role: OrganizerRole;
  name: string;
  avatarUrl: string | null;
  isMe: boolean;
  joinedAt: string | null;
};
type Invite = { id: string; role: Exclude<OrganizerRole, "owner">; url: string; expiresAt: string; usedCount: number; maxUses: number };
type Data = {
  ready: boolean;
  isTeam: boolean;
  role: OrganizerRole;
  maxPeople?: number;
  organizationName?: string;
  members: Member[];
  invites: Invite[];
};

/** 役割の見た目と、できること（見本 08） */
export const ROLE_INFO: Record<OrganizerRole, { label: string; desc: string; Icon: LucideIcon; color: string; bg: string; can: string[] }> = {
  owner: {
    label: "オーナー",
    desc: "団体のアカウント本人。すべてできます",
    Icon: Crown,
    color: "#a26a10",
    bg: "#fdf1d8",
    can: ["すべての機能", "プランの変更・売上の受け取り", "メンバーの招待・権限の変更"],
  },
  admin: {
    label: "管理者",
    desc: "全ての機能・メンバー管理",
    Icon: Crown,
    color: "#a26a10",
    bg: "#fdf1d8",
    can: ["イベント・お店・募集の作成と編集", "応募者や参加者の確認、当日の受付・レジ", "メンバーの招待・権限の変更（編集者・スタッフ）"],
  },
  editor: {
    label: "編集者",
    desc: "掲載の作成・編集、応募管理",
    Icon: PenLine,
    color: "#2f7d4e",
    bg: "#e6f3ea",
    can: ["イベント・店舗情報の作成と編集", "応募者や参加者の確認", "運営ダッシュボードの閲覧"],
  },
  staff: {
    label: "スタッフ",
    desc: "当日受付・チェックインなど",
    Icon: UserRound,
    color: "#2f6fae",
    bg: "#e6f1fa",
    can: ["当日の受付・チェックイン", "レジでの会計", "掲載や参加者の確認（変更はできません）"],
  },
};

function RoleChip({ role }: { role: OrganizerRole }) {
  const r = ROLE_INFO[role];
  return (
    <span className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: r.bg, color: r.color }}>
      {r.label}
    </span>
  );
}

function Avatar({ m }: { m: Member }) {
  const r = ROLE_INFO[m.role];
  return m.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[16px] font-bold" style={{ background: r.bg, color: r.color }} aria-hidden>
      {m.name.slice(0, 1)}
    </span>
  );
}

/** 権限の設定（見本 08）。下から出る */
function RoleSheet({
  member,
  myRole,
  onClose,
  onDone,
}: {
  member: Member;
  myRole: OrganizerRole;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [role, setRole] = useState<Exclude<OrganizerRole, "owner">>(member.role === "owner" ? "editor" : member.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const choices: Exclude<OrganizerRole, "owner">[] = myRole === "owner" ? ["admin", "editor", "staff"] : ["editor", "staff"];
  const canEdit = !member.isMe && (myRole === "owner" || (myRole === "admin" && member.role !== "admin"));

  async function call(method: "PATCH" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/team/members/${member.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PATCH" ? JSON.stringify({ role }) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "できませんでした");
      onDone(method === "PATCH" ? `${member.name}さんを「${ROLE_INFO[role].label}」にしました` : json.left ? "チームを抜けました" : `${member.name}さんをチームから外しました`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const info = ROLE_INFO[role];
  // 画面の一番外（body）に出す。下のナビより上に重ねるため
  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/30 pc:items-center" role="dialog" aria-modal="true" aria-label="メンバーの権限設定">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[22px] bg-[#fbfcf9] p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pc:rounded-[22px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#163828]">メンバーの権限設定</h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="flex h-11 w-11 items-center justify-center rounded-full text-[#5f6d64]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-[16px] border border-[#ebeee8] bg-white p-3">
          <Avatar m={member} />
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-[#163828]">{member.name}</span>
          <RoleChip role={member.role} />
        </div>

        {canEdit ? (
          <>
            <p className="mb-2 text-[14px] font-bold text-[#163828]">権限を選択</p>
            <div className="space-y-2" role="radiogroup" aria-label="権限">
              {choices.map((c) => {
                const r = ROLE_INFO[c];
                const on = role === c;
                return (
                  <label
                    key={c}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-[16px] border-[1.5px] bg-white p-3",
                      on ? "border-[#2f7d4e] bg-[#f1f8f3]" : "border-[#e3e8e3]"
                    )}
                  >
                    <input type="radio" name="member-role" checked={on} onChange={() => setRole(c)} className="h-5 w-5 accent-[#2f7d4e]" />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: r.bg, color: r.color }} aria-hidden>
                      <r.Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold text-[#163828]">{r.label}</span>
                      <span className="block text-[12px] text-[#5f6d64]">{r.desc}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        ) : null}

        <p className="mb-2 mt-4 text-[14px] font-bold text-[#163828]">{info.label}ができること</p>
        <ul className="space-y-2 rounded-[16px] border border-[#ebeee8] bg-white p-3">
          {info.can.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-[#3f5146]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7d4e]" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-2 rounded-[14px] border border-[#d9eadf] bg-[#f1f8f3] px-3 py-2.5 text-[12px] text-[#3f5146]">
          <Lock className="h-4 w-4 shrink-0 text-[#2f7d4e]" aria-hidden />
          プランの変更はオーナーだけ、権限の再設定はオーナーと管理者だけが行えます。
        </p>

        {error ? <p className="mt-3 text-center text-[13px] font-bold text-[#b84060]" role="alert">{error}</p> : null}

        <div className="mt-4 flex flex-col gap-2">
          {canEdit ? (
            <button type="button" disabled={busy || role === member.role} onClick={() => void call("PATCH")} className="h-12 rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white disabled:opacity-50">
              {busy ? "保存中…" : "この権限にする"}
            </button>
          ) : null}
          {member.role !== "owner" && (member.isMe || canEdit) ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(member.isMe ? "このチームを抜けますか？" : `${member.name}さんをチームから外しますか？`)) void call("DELETE");
              }}
              className="h-12 rounded-[14px] border-[1.5px] border-[#f0d4d4] bg-white text-[14px] font-bold text-[#a3403a]"
            >
              {member.isMe ? "チームを抜ける" : "チームから外す"}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * チーム・招待（見本 03）。メンバーを押すと権限設定（見本 08）。招待リンクは /organizer/team/invite（見本 07）。
 */
export function OrganizerTeamPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"members" | "invites">("members");
  const [selected, setSelected] = useState<Member | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/organizer/team", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "読み込めませんでした");
      setData(json as Data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    if (!window.confirm("この招待リンクを取り消しますか？")) return;
    const res = await fetch(`/api/organizer/team/invites/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage("招待リンクを取り消しました");
      void load();
    }
  }

  const canInvite = data ? data.isTeam && roleAtLeast(data.role, "admin") : false;
  const full = data ? data.members.length >= (data.maxPeople ?? 5) : false;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-24 pc:pb-6">
      <div className="flex items-start gap-2.5 pt-1">
        <Link href="/organizer/settings" aria-label="マイページに戻る" className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3ef] text-[#3c4a40]">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold text-[#163828]">チーム・招待</h1>
          <p className="text-[12.5px] text-[#5f6d64]">メンバーと一緒に地域イベントを運営</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#e6f3ea] text-[#2f7d4e]" aria-hidden>
          <UserPlus className="h-6 w-6" />
        </span>
      </div>

      {message ? (
        <p className="rounded-[14px] bg-[#e3f2e7] px-4 py-2.5 text-center text-[13px] font-bold text-[#1f7a4a]" role="status">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[16px] border border-[#f1d9c4] bg-[#fdf6ef] px-4 py-4 text-[13px] text-[#7a5a3a]">{error}</p>
      ) : !data ? (
        <div className="space-y-3">
          <div className="h-[240px] animate-pulse rounded-[22px] bg-[#e8ede4]" />
          <div className="h-[180px] animate-pulse rounded-[18px] bg-[#e8ede4]" />
        </div>
      ) : !data.ready ? (
        <p className="rounded-[16px] border border-[#ecd9a6] bg-[#fffaf0] px-4 py-4 text-[13px] leading-relaxed text-[#6b5a33]">
          チームの機能はただいま準備中です。もうしばらくお待ちください。
        </p>
      ) : (
        <>
          {/* 呼びかけ（見本 03） */}
          <section className="flex flex-col items-center gap-3 rounded-[22px] border border-[#e3e8e3] bg-white px-5 py-6 text-center shadow-[0_3px_12px_rgba(22,56,40,0.05)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f3ea] text-[#2f7d4e]" aria-hidden>
              <UsersRound className="h-8 w-8" />
            </span>
            <p className="text-[20px] font-bold leading-snug text-[#1f5e3a]" style={{ fontFamily: "'Noto Serif JP', serif" }}>
              一緒につくる、
              <br />
              もっと楽しいまち。
            </p>
            <p className="text-[12.5px] text-[#5f6d64]">招待リンクでチームに参加できます。</p>
            {canInvite ? (
              full ? (
                <p className="text-[12.5px] font-bold text-[#a26a10]">チームは{data.maxPeople ?? 5}人までです（いま{data.members.length}人）</p>
              ) : (
                <Link
                  href="/organizer/team/invite"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white"
                >
                  <Link2 className="h-5 w-5" aria-hidden />
                  招待リンクを発行
                </Link>
              )
            ) : !data.isTeam ? null : (
              <p className="text-[12.5px] text-[#6b776f]">招待はオーナーか管理者ができます。</p>
            )}
          </section>

          {!data.isTeam ? (
            <Link
              href="/organizer/settings/plan"
              className="flex min-h-[48px] items-center justify-between gap-2 rounded-[14px] border border-[#ecd9a6] bg-[#fffaf0] px-4 py-2.5 text-[13px] text-[#6b5a33]"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#a87412]" aria-hidden />
                TEAMプランで共同運営が利用できます
              </span>
              <span className="shrink-0 font-bold text-[#1f7a4a]">プランを確認 ›</span>
            </Link>
          ) : null}

          {/* メンバー／招待中 */}
          {roleAtLeast(data.role, "admin") ? (
            <div className="grid grid-cols-2 gap-1 rounded-[16px] bg-[#eef1ec] p-1" role="tablist" aria-label="チーム">
              {(["members", "invites"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn("h-11 rounded-[12px] text-[14px] font-bold", tab === t ? "bg-[#2f7d4e] text-white" : "text-[#5f6d64]")}
                >
                  {t === "members" ? "メンバー" : `招待中（${data.invites.length}）`}
                </button>
              ))}
            </div>
          ) : null}

          {tab === "members" ? (
            <section aria-labelledby="team-members" className="space-y-2">
              <h2 id="team-members" className="text-[16px] font-bold text-[#163828]">
                チームメンバー（{data.members.length}名）
              </h2>
              <ul className="divide-y divide-[#eef1ec] overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white">
                {data.members.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(m)}
                      className="flex min-h-[64px] w-full items-center gap-3 px-3.5 py-2.5 text-left"
                    >
                      <Avatar m={m} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-[#163828]">{m.name}</span>
                        <span className="block text-[12px] text-[#6b776f]">{m.isMe ? "あなた" : m.role === "owner" ? "団体のアカウント" : "招待リンクで参加"}</span>
                      </span>
                      <RoleChip role={m.role} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section aria-label="招待中のリンク" className="space-y-2">
              {data.invites.length === 0 ? (
                <p className="rounded-[16px] border border-dashed border-[#d6e3da] bg-white px-4 py-4 text-[13px] text-[#6b776f]">
                  使える招待リンクはありません。
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.invites.map((inv) => (
                    <li key={inv.id} className="flex items-center gap-2 rounded-[16px] border border-[#ebeee8] bg-white p-3">
                      <RoleChip role={inv.role} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] text-[#1f5e3a]">{inv.url.replace(/^https?:\/\//, "")}</span>
                        <span className="block text-[11.5px] text-[#6b776f]">
                          {new Date(inv.expiresAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}まで
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label="リンクをコピー"
                        onClick={() => {
                          void navigator.clipboard?.writeText(inv.url).then(() => setCopied(inv.id));
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-[#2f7d4e]"
                      >
                        {copied === inv.id ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                      </button>
                      <button type="button" onClick={() => void revoke(inv.id)} className="h-11 px-2 text-[12.5px] font-bold text-[#a3403a]">
                        取り消す
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {selected && data ? (
        <RoleSheet
          member={selected}
          myRole={data.role}
          onClose={() => setSelected(null)}
          onDone={(msg) => {
            setSelected(null);
            setMessage(msg);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

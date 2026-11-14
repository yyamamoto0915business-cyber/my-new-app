"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Copy, Share2, UserPlus, UsersRound } from "lucide-react";
import type { OrganizerRole } from "@/lib/organizer/team";
import { ROLE_INFO } from "@/components/organizer/team/OrganizerTeamPage";

type MemberRole = Exclude<OrganizerRole, "owner">;

/**
 * メンバーを招待（見本 07）。権限と有効期限を選んで、招待リンクを発行する。リンクは1人1回使える。
 * （見本の「メールで招待」は、メールを送る仕組みがまだないので、リンクを共有してもらう形にしている）
 */
export function OrganizerTeamInvitePage() {
  const [myRole, setMyRole] = useState<OrganizerRole | null>(null);
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/organizer/team", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setMyRole((j.role as OrganizerRole) ?? null);
        setOrgName(j.organizationName ?? "");
      })
      .catch(() => {});
  }, []);

  async function issue() {
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/organizer/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, days }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "招待リンクを作れませんでした");
      setLink(json.url as string);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!link) return;
    const text = `${orgName || "主催者"}のチームに招待します（MachiGlyph）`;
    try {
      if (navigator.share) await navigator.share({ title: "チームへの招待", text, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
      }
    } catch {
      /* 共有をやめたとき */
    }
  }

  const roles: MemberRole[] = myRole === "owner" ? ["admin", "editor", "staff"] : ["editor", "staff"];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-24 pc:pb-6">
      <div className="flex items-start gap-2.5 pt-1">
        <Link href="/organizer/team" aria-label="チームに戻る" className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f3ef] text-[#3c4a40]">
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold text-[#163828]">メンバーを招待</h1>
          <p className="text-[12.5px] text-[#5f6d64]">共同運営メンバーを追加する</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#e6f3ea] text-[#2f7d4e]" aria-hidden>
          <UserPlus className="h-6 w-6" />
        </span>
      </div>

      <section className="flex flex-col items-center gap-2 rounded-[22px] border border-[#d9eadf] bg-gradient-to-br from-[#f1f8f3] to-[#fbf8ee] px-5 py-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#2f7d4e]" aria-hidden>
          <UsersRound className="h-8 w-8" />
        </span>
        <p className="text-[19px] font-bold leading-snug text-[#1f5e3a]">
          仲間と一緒に、
          <br />
          イベントをつくろう。
        </p>
        <p className="text-[12.5px] text-[#5f6d64]">リンクを共有してチームに招待できます</p>
      </section>

      <div className="space-y-1.5">
        <p className="text-[14px] font-bold text-[#163828]">招待するチーム</p>
        <p className="flex h-12 items-center rounded-[14px] border border-[#dfe7e1] bg-white px-3.5 text-[15px] text-[#163828]">
          {orgName || "　"}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="invite-days" className="block text-[14px] font-bold text-[#163828]">
          リンクの有効期限
        </label>
        <select
          id="invite-days"
          value={days}
          onChange={(e) => {
            setDays(Number(e.target.value));
            setLink(null);
          }}
          className="h-12 w-full rounded-[14px] border border-[#dfe7e1] bg-white px-3 text-[16px] text-[#163828]"
        >
          <option value={1}>1日間</option>
          <option value={7}>7日間</option>
          <option value={30}>30日間</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="invite-role" className="block text-[14px] font-bold text-[#163828]">
          招待時の権限
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as MemberRole);
            setLink(null);
          }}
          className="h-12 w-full rounded-[14px] border border-[#dfe7e1] bg-white px-3 text-[16px] text-[#163828]"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_INFO[r].label}（{ROLE_INFO[r].desc}）
            </option>
          ))}
        </select>
      </div>

      {link ? (
        <div className="space-y-1.5">
          <p className="text-[14px] font-bold text-[#163828]">招待リンク</p>
          <div className="flex items-center gap-2 rounded-[14px] border border-[#cfe3d6] bg-[#f1f8f3] px-3.5 py-2">
            <span className="min-w-0 flex-1 truncate text-[14px] text-[#1f5e3a]">{link.replace(/^https?:\/\//, "")}</span>
            <button
              type="button"
              aria-label="リンクをコピー"
              onClick={() => void navigator.clipboard?.writeText(link).then(() => setCopied(true))}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#2f7d4e]"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-[12px] leading-relaxed text-[#6b776f]">
            このリンクは1人だけ使えます。開いた人がログインして「参加する」を押すと、{ROLE_INFO[role].label}としてチームに入ります。
          </p>
          <button type="button" onClick={() => void share()} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white">
            <Share2 className="h-5 w-5" aria-hidden />
            リンクを送る
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => void issue()} disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#2f7d4e] text-[15px] font-bold text-white disabled:opacity-60">
          {busy ? "発行中…" : "招待リンクを発行する"}
        </button>
      )}
      {error ? <p className="text-center text-[13px] font-bold text-[#b84060]" role="alert">{error}</p> : null}
    </div>
  );
}

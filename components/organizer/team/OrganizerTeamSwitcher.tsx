"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { OrganizerRole } from "@/lib/organizer/team";

export type OrganizerTeamChoice = { organizerId: string; name: string; role: OrganizerRole; roleLabel: string };
type Teams = { current: string | null; teams: OrganizerTeamChoice[] };

let cache: Promise<Teams> | null = null;

function loadTeams(): Promise<Teams> {
  if (!cache) {
    cache = fetch("/api/organizer/teams", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { current: null, teams: [] }))
      .then((j: Partial<Teams>) => ({ current: j.current ?? null, teams: Array.isArray(j.teams) ? j.teams : [] }))
      .catch(() => {
        cache = null;
        return { current: null, teams: [] };
      });
  }
  return cache;
}

/** いま使えるチームと、いま使っているチーム。読み込み中は null */
export function useOrganizerTeams(): Teams | null {
  const [teams, setTeams] = useState<Teams | null>(null);
  useEffect(() => {
    let alive = true;
    void loadTeams().then((t) => {
      if (alive) setTeams(t);
    });
    return () => {
      alive = false;
    };
  }, []);
  return teams;
}

/**
 * TEAM：いくつかのチームに入っている人が、使うチームを切りかえる（チームが1つなら何も出さない）。
 * 切りかえたら主催者のホームから開き直す（役割・掲載・売上など、画面の中身がすべてそのチームのものになる）。
 */
export function OrganizerTeamSwitcher() {
  const data = useOrganizerTeams();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data || data.teams.length < 2) return null;

  async function choose(organizerId: string) {
    if (busy || organizerId === data?.current) return;
    setBusy(organizerId);
    setError(null);
    try {
      const res = await fetch("/api/organizer/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizerId }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "切りかえられませんでした");
      window.location.href = "/organizer";
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="team-switch" className="space-y-2 rounded-[18px] border border-[#e3e8e3] bg-white p-4 shadow-[0_3px_12px_rgba(22,56,40,0.05)]">
      <div>
        <h2 id="team-switch" className="text-[16px] font-bold text-[#163828]">
          使うチーム
        </h2>
        <p className="text-[12px] text-[#5f6d64]">入っているチームが {data.teams.length} つあります。選ぶと、主催者の画面がそのチームに切りかわります。</p>
      </div>
      <ul className="grid gap-2" role="radiogroup" aria-labelledby="team-switch">
        {data.teams.map((t) => {
          const on = t.organizerId === data.current;
          return (
            <li key={t.organizerId}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy !== null}
                onClick={() => void choose(t.organizerId)}
                className={`flex min-h-[56px] w-full items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-left disabled:opacity-60 ${
                  on ? "border-2 border-[#2f7d4e] bg-[#f3f9f5]" : "border border-[#e3e8e3] bg-white active:bg-[#fafcf9]"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold text-[#163828]">{t.name}</span>
                  <span className="block text-[12px] text-[#5f6d64]">
                    {t.role === "owner" ? "自分の主催者アカウント" : `${t.roleLabel}として参加`}
                  </span>
                </span>
                {on ? (
                  <span className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#2f7d4e]">
                    <Check className="h-4 w-4" aria-hidden />
                    使用中
                  </span>
                ) : busy === t.organizerId ? (
                  <span className="shrink-0 text-[12px] font-bold text-[#5f6d64]">切りかえ中…</span>
                ) : (
                  <span className="shrink-0 text-[12px] font-bold text-[#1f7a4a]">切りかえる</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="text-[12.5px] text-[#b91c1c]">{error}</p> : null}
    </section>
  );
}

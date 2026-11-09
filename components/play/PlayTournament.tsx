"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, Loader2, RefreshCw } from "lucide-react";
import type { TournamentMatch, TournamentView } from "@/lib/organizer/tournament";

function nameOf(view: TournamentView, index: number | null, bye: boolean): string {
  if (index !== null) return view.entrants[index] ?? "—";
  return bye ? "（不戦勝）" : "未定";
}

/** 1試合の箱（勝った方を太字・緑にする） */
function MatchBox({
  view,
  match,
  onPick,
}: {
  view: TournamentView;
  match: TournamentMatch;
  /** 主催者の画面では、押すとその試合を開く */
  onPick?: (match: TournamentMatch) => void;
}) {
  const side = (index: number | null, score: number | null) => {
    const won = match.winner !== null && match.winner === index;
    const lost = match.winner !== null && index !== null && match.winner !== index;
    return (
      <div
        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12.5px] ${
          won ? "bg-[#eaf4ee] font-bold text-[#1e5a3a]" : lost ? "text-[#9aa79f]" : "text-[#1e3828]"
        }`}
      >
        <span className="min-w-0 truncate">{nameOf(view, index, match.bye)}</span>
        {score !== null ? <span className="shrink-0 tabular-nums">{score}</span> : null}
      </div>
    );
  };
  const body = (
    <>
      {side(match.a, match.scoreA)}
      <div className="h-px bg-[#eef1ec]" />
      {side(match.b, match.scoreB)}
      {match.draw ? <p className="bg-[#f6f8f4] py-0.5 text-center text-[10.5px] text-[#6a7a70]">引き分け</p> : null}
    </>
  );
  const cls = `block w-full overflow-hidden rounded-lg border bg-white text-left ${
    match.bye ? "border-dashed border-[#d8e0da] opacity-70" : "border-[#dfe6e1]"
  }`;
  if (onPick && match.playable) {
    return (
      <button type="button" onClick={() => onPick(match)} className={`${cls} transition hover:border-[#7b4fc9]`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/** 対戦表（勝ち抜きは横に回戦を並べ、リーグ戦は順位表と節ごとの試合） */
export function TournamentBoard({
  view,
  onPick,
}: {
  view: TournamentView;
  onPick?: (match: TournamentMatch) => void;
}) {
  if (view.format === "knockout") {
    return (
      <div className="space-y-3">
        {view.champion !== null ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#fff6dc] to-[#fdf0c4] px-3 py-3">
            <Crown className="h-5 w-5 text-[#c9a227]" aria-hidden />
            <p className="text-[15px] font-bold text-[#3a2c06]">優勝 {view.entrants[view.champion]}</p>
          </div>
        ) : null}
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max gap-3">
            {view.rounds.map((round) => (
              <div key={round.round} className="flex w-[150px] shrink-0 flex-col">
                <p className="mb-1.5 text-center text-[11.5px] font-bold text-[#7b4fc9]">{round.label}</p>
                <div className="flex flex-1 flex-col justify-around gap-2">
                  {round.matches.map((m) => (
                    <MatchBox key={m.key} view={view} match={m} onPick={onPick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] text-[#7a8a80]">
          {view.done}/{view.total} 試合おわり{view.rounds[0].matches.length > 2 ? "・横にスクロールできます" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-[#e8ece6] bg-white">
        <table className="w-full min-w-[340px] text-[12.5px]">
          <thead className="bg-[#f6f8f4] text-[11px] text-[#6a7a70]">
            <tr>
              <th className="px-2 py-1.5 text-left font-semibold">順位</th>
              <th className="px-2 py-1.5 text-left font-semibold">名前</th>
              <th className="px-1.5 py-1.5 font-semibold">勝点</th>
              <th className="px-1.5 py-1.5 font-semibold">勝</th>
              <th className="px-1.5 py-1.5 font-semibold">分</th>
              <th className="px-1.5 py-1.5 font-semibold">負</th>
              <th className="px-1.5 py-1.5 font-semibold">得失</th>
            </tr>
          </thead>
          <tbody>
            {view.standings?.map((s) => (
              <tr key={s.index} className="border-t border-[#f0f2ee]">
                <td className="px-2 py-1.5 font-bold text-[#7b4fc9]">{s.rank}</td>
                <td className="max-w-[140px] truncate px-2 py-1.5 font-semibold text-[#1e3828]">{s.name}</td>
                <td className="px-1.5 py-1.5 text-center font-bold tabular-nums">{s.points}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums">{s.win}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums">{s.draw}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums">{s.loss}</td>
                <td className="px-1.5 py-1.5 text-center tabular-nums">
                  {s.scoreFor - s.scoreAgainst > 0 ? "+" : ""}
                  {s.scoreFor - s.scoreAgainst}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-center text-[11px] text-[#7a8a80]">
        勝ち3点・引き分け1点 ・ {view.done}/{view.total} 試合おわり
      </p>
      <div className="space-y-3">
        {view.rounds.map((round) => (
          <div key={round.round}>
            <p className="mb-1.5 text-[11.5px] font-bold text-[#7b4fc9]">{round.label}</p>
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              {round.matches.map((m) => (
                <MatchBox key={m.key} view={view} match={m} onPick={onPick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 参加者が見る対戦表。主催者が結果を入れると、30秒ごとに新しくなる */
export function PlayTournament({ token }: { token: string }) {
  const [view, setView] = useState<TournamentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/tournament`, { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { view?: TournamentView; error?: string };
      if (!res.ok || !json.view) {
        setError(json.error ?? "読み込めませんでした");
        return;
      }
      setError(null);
      setView(json.view);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 30_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [load]);

  if (loading && !view) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#6a7a70]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        読み込み中…
      </div>
    );
  }
  if (!view) return <p className="py-8 text-center text-[13px] text-[#b91c1c]">{error ?? "対戦表を読み込めませんでした"}</p>;

  return (
    <div className="space-y-3">
      <TournamentBoard view={view} />
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="mx-auto flex items-center gap-1.5 text-[12px] font-semibold text-[#2e8a5a] disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden />
        最新の状態にする
      </button>
      {error ? <p className="text-center text-[12px] text-[#b91c1c]">{error}</p> : null}
    </div>
  );
}

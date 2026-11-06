"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Loader2, PartyPopper, RefreshCw } from "lucide-react";
import { readPlaySession } from "@/lib/organizer/play-session";
import type { LotteryPlayState } from "@/lib/organizer/lottery-play";

type Props = { token: string };

/** 抽選の参加画面。結果発表は主催者が切りかえるので、開いている間はときどき読み直す */
export function PlayLottery({ token }: Props) {
  const [state, setState] = useState<LotteryPlayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = readPlaySession(token);
    if (!session) {
      setError("先に参加用QRから入ってください");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/play/${encodeURIComponent(token)}/lottery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceToken: session.deviceToken }),
      });
      const json = (await res.json().catch(() => ({}))) as { state?: LotteryPlayState; error?: string };
      if (!res.ok || !json.state) {
        setError(json.error ?? "読み込めませんでした");
        return;
      }
      setError(null);
      setState(json.state);
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
    // 受付中は、発表を待っている人のために30秒ごとに確かめる
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [load]);

  if (loading && !state) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#6a7a70]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        読み込み中…
      </div>
    );
  }
  if (!state) {
    return <p className="py-8 text-center text-[13px] text-[#b91c1c]">{error ?? "抽選を読み込めませんでした"}</p>;
  }

  const result = state.result;

  return (
    <div className="space-y-4">
      {result ? (
        result.won ? (
          <div className="rounded-2xl bg-gradient-to-br from-[#fff1e6] to-[#ffe0dc] px-4 py-5 text-center">
            <PartyPopper className="mx-auto h-9 w-9 text-[#d9534f]" aria-hidden />
            <p className="mt-1 text-[13px] font-semibold text-[#a0403c]">おめでとうございます！</p>
            <p className="mt-0.5 text-[22px] font-bold leading-snug text-[#3a1a18]">{result.won.prizeLabel}</p>
            <p className="mt-1 text-[13px] text-[#6a3a36]">に当選しました</p>
            {state.entryNumber ? (
              <p className="mt-3 inline-block rounded-full bg-white/80 px-3 py-1 text-[13px] font-bold text-[#3a1a18]">
                あなたの番号 No.{state.entryNumber}
              </p>
            ) : null}
            {result.winnerMessage ? (
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/80 px-3 py-2.5 text-left text-[13px] leading-relaxed text-[#3a1a18]">
                {result.winnerMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#f3f5f2] px-4 py-5 text-center">
            <p className="text-[15px] font-bold text-[#1e3828]">今回は、はずれでした</p>
            <p className="mt-1 text-[12.5px] text-[#6a7a70]">参加してくれて、ありがとうございました。</p>
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-[#f6f8f4] px-4 py-5 text-center">
          <p className="text-[12px] font-semibold text-[#2e8a5a]">エントリーしました</p>
          {state.entryNumber ? (
            <p className="mt-1 text-[30px] font-bold leading-none text-[#1e3828]">No.{state.entryNumber}</p>
          ) : null}
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#4a5a50]">
            結果の発表まで、この画面を開いたまま待っていてください。
            <br />
            発表されると、ここに当たり・はずれが出ます。
          </p>
          <p className="mt-2 text-[11.5px] text-[#7a8a80]">いま {state.entrants}人 が参加しています</p>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-[#4a5a50]">{result ? "当選した人" : "賞"}</p>
        <ul className="space-y-1.5">
          {(result ? result.winners : state.prizes.map((p) => ({ prizeLabel: p.label, nicknames: [] as string[] }))).map(
            (row, i) => (
              <li key={`${row.prizeLabel}-${i}`} className="rounded-xl border border-[#e8ece6] bg-white px-3.5 py-2.5">
                <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#1e3828]">
                  <Gift className="h-3.5 w-3.5 text-[#d9534f]" aria-hidden />
                  {row.prizeLabel}
                  {!result ? (
                    <span className="text-[11.5px] font-normal text-[#7a8a80]">{state.prizes[i]?.count}人</span>
                  ) : null}
                </p>
                {result ? (
                  <p className="mt-0.5 text-[12.5px] text-[#4a5a50]">
                    {row.nicknames.length > 0 ? row.nicknames.join("、") : "—"}
                  </p>
                ) : null}
              </li>
            ),
          )}
        </ul>
      </div>

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

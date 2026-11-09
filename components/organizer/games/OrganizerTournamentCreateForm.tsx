"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Rocket, Shuffle, Trophy } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GameCardSetup, gameCardItem } from "@/components/organizer/games/GameCardSetup";
import { GameDraftLoading } from "@/components/organizer/games/GameDraftLoading";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import { PeriodPresets, jstDate, periodProblem } from "@/components/organizer/games/PeriodPresets";
import { useGameDraft } from "@/components/organizer/games/useGameDraft";
import { TournamentBoard } from "@/components/play/PlayTournament";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import { pickRandom } from "@/lib/organizer/lottery";
import {
  TOURNAMENT_FORMAT_LABELS,
  TOURNAMENT_NAME_MAX,
  buildTournamentView,
  sanitizeTournamentSettings,
  tournamentEntrantMax,
  type MatchResult,
  type TournamentFormat,
} from "@/lib/organizer/tournament";

const STEPS = [
  { id: "entrants", label: "出場者と形式" },
  { id: "basic", label: "基本設定" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: Trophy },
  { label: STEPS[1].label, icon: PenLine },
  { label: STEPS[2].label, icon: Rocket },
];

function toIso(date: string, time: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}:00+09:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

const field =
  "mt-1.5 w-full rounded-xl border border-[#d8e4dc] bg-white px-3.5 py-2.5 text-[14px] text-[#1e3828] outline-none transition focus:border-[#2e8a5a] focus:ring-2 focus:ring-[#2e8a5a]/15";
const labelCls = "block text-[13px] font-semibold text-[#1e3828]";
const card =
  "space-y-5 rounded-2xl border border-[#e8ece6] bg-white p-5 shadow-[0_4px_18px_rgba(30,56,40,0.04)] min-[900px]:p-6";

const SAMPLE = ["チームあおば", "まちの灯", "ひだまりFC", "こはるズ", "そら組", "みどりの会"];

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[44px] flex-1 rounded-xl border px-2 text-[13px] font-semibold transition ${
        on ? "border-[#7b4fc9] bg-[#f3eefb] text-[#5a37a0]" : "border-[#e3e8e2] bg-white text-[#4a5a50] hover:border-[#b9a3e3]"
      }`}
    >
      {children}
    </button>
  );
}

/** 「お試しで見る」：記録せずに、試合を押して勝ち上がりを試す */
function TournamentTryDemo({ format, entrants }: { format: TournamentFormat; entrants: string[] }) {
  const [results, setResults] = useState<Record<string, MatchResult>>({});
  const settings = { format, entrants: entrants.length >= 2 ? entrants : SAMPLE.slice(0, 4) };
  const view = buildTournamentView(settings, results);
  return (
    <div className="space-y-3 px-4 pb-6 pt-2">
      <p className="text-[12px] text-[#6a7a70]">
        試合を押すと、上の方が勝ったことになります（もう一度押すと下の方）。本番では、ゲームの管理画面から結果を入れます。
      </p>
      <TournamentBoard
        view={view}
        onPick={(m) => {
          if (m.a === null || m.b === null) return;
          const next = m.winner === m.a ? m.b : m.a;
          setResults((prev) => ({ ...prev, [m.key]: { winner: next, scoreA: null, scoreB: null } }));
        }}
      />
      <button type="button" onClick={() => setResults({})} className="mx-auto block text-[12px] text-[#7a8a80]">
        はじめから
      </button>
    </div>
  );
}

/** トーナメント表の作成。出場者と形式 → 期間など → 公開。結果は公開後にゲームの管理画面で入れる */
export function OrganizerTournamentCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("entrants");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("対戦表と結果を、スマホでいつでも見られます。");
  const [eventId, setEventId] = useState("");
  const [cardImage, setCardImage] = useState("");
  const [startDate, setStartDate] = useState(() => jstDate());
  const [endDate, setEndDate] = useState(() => jstDate(6));
  const [format, setFormat] = useState<TournamentFormat>("knockout");
  const [entrantText, setEntrantText] = useState("");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [confirmOk, setConfirmOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const draft = useGameDraft((saved) => {
    setName(saved.name);
    setDescription(saved.description);
    setEventId(saved.eventId);
    if (saved.startDate) setStartDate(saved.startDate);
    if (saved.endDate) setEndDate(saved.endDate);
    setCardImage(typeof saved.settings.cardImage === "string" ? saved.settings.cardImage : "");
    const t = sanitizeTournamentSettings(saved.settings.tournament);
    setFormat(t.format);
    setEntrantText(t.entrants.join("\n"));
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/organizer/games?events=1&games=0", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && !cancelled) setEvents((json.events ?? []) as OrganizerGameEventOption[]);
      } catch {
        /* イベントは選ばなくても作れる */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const settings = useMemo(
    () => sanitizeTournamentSettings({ format, entrants: entrantText.split("\n") }),
    [format, entrantText],
  );
  const rawCount = entrantText.split("\n").filter((s) => s.trim()).length;
  const max = tournamentEntrantMax(format);
  const preview = settings.entrants.length >= 2 ? buildTournamentView(settings, {}) : null;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function validate(id: StepId): string | null {
    if (id === "entrants") {
      if (settings.entrants.length < 2) return "出場者を2つ以上入れてください（1行に1つ）";
      if (rawCount > max) return `${TOURNAMENT_FORMAT_LABELS[format]}の出場者は${max}までです`;
      if (new Set(settings.entrants).size !== settings.entrants.length) return "同じ名前が入っています。見分けがつくように直してください";
    }
    if (id === "basic") {
      if (!name.trim()) return "ゲーム名を入力してください";
      return periodProblem(startDate, endDate);
    }
    return null;
  }

  function goNext() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)].id);
  }

  async function save(status: "draft" | "published") {
    const message = validate("entrants") ?? validate("basic");
    if (message) {
      setError(message);
      return;
    }
    if (status === "published" && !confirmOk) {
      setError("公開前に、内容の確認にチェックしてください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await draft.saveGame(
        {
          name: name.trim(),
          type: "tournament",
          eventId: eventId || null,
          cardImage,
          participation: "remote",
          description: description.trim(),
          startsAt: toIso(startDate, "00:00"),
          endsAt: toIso(endDate, "23:59"),
          spots: [],
          tournament: settings,
        },
        status,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (status === "published") {
        setPublished(true);
        return;
      }
      router.push(`/organizer/games/${result.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (draft.loading || draft.loadError) return <GameDraftLoading error={draft.loadError} />;

  if (published) {
    return (
      <GamePublishSuccess
        typeLabel="トーナメント表"
        card={gameCardItem({
          type: "tournament",
          typeLabel: "トーナメント表",
          name,
          startDate,
          event: events.find((item) => item.id === eventId) ?? null,
          cardImage,
        })}
      />
    );
  }

  return (
    <>
      <GameCreateShell
        title="トーナメント表の作成"
        steps={SHELL_STEPS}
        step={stepIndex}
        onStep={(index) => {
          setError(null);
          setStep(STEPS[index].id);
        }}
        onNext={goNext}
        preview={
          <div className="mx-auto w-full max-w-[360px] rounded-[28px] border border-[#e3e8e2] bg-white p-4 shadow-[0_8px_28px_rgba(30,56,40,0.08)]">
            <p className="text-[11px] font-semibold text-[#7b4fc9]">トーナメント表</p>
            <p className="mb-3 text-[17px] font-bold text-[#1e3828]">{name || "ゲーム名"}</p>
            {preview ? (
              <TournamentBoard view={preview} />
            ) : (
              <p className="rounded-xl bg-[#f6f8f4] px-3 py-6 text-center text-[12px] text-[#7a8a80]">出場者を入れると、対戦表がここに出ます</p>
            )}
          </div>
        }
        saving={saving}
        error={error}
        onTry={() => setTesting(true)}
        onDraft={() => void save("draft")}
        onPublish={() => void save("published")}
      >
        {step === "entrants" ? (
          <section className={card}>
            <div>
              <h2 className="text-[18px] font-bold text-[#1e3828]">形式と出場者</h2>
              <p className="mt-1 text-[12.5px] text-[#6a7a70]">チーム名や人の名前を、1行に1つずつ入れてください。</p>
            </div>
            <div>
              <p className={labelCls}>形式</p>
              <div className="mt-1.5 flex gap-1.5">
                {(Object.keys(TOURNAMENT_FORMAT_LABELS) as TournamentFormat[]).map((f) => (
                  <Choice key={f} on={format === f} onClick={() => setFormat(f)}>
                    {TOURNAMENT_FORMAT_LABELS[f]}
                  </Choice>
                ))}
              </div>
              <p className="mt-1.5 text-[11.5px] text-[#6a7a70]">
                {format === "knockout"
                  ? `負けたら終わりの勝ち抜きです。人数が合わないときは、上の人から不戦勝（シード）になります。${max}まで。`
                  : `全員と1回ずつ対戦し、勝ち点（勝ち3・引き分け1）で順位を決めます。${max}まで。`}
              </p>
            </div>
            <label className={labelCls}>
              出場者 <span className="text-[11px] text-[#c8a84b]">必須</span>
              <textarea
                value={entrantText}
                onChange={(e) => setEntrantText(e.target.value)}
                rows={8}
                placeholder={SAMPLE.join("\n")}
                className={`${field} resize-y font-normal leading-[1.7]`}
              />
              <span className={`mt-1 block text-[11.5px] font-normal ${rawCount > max ? "text-[#b91c1c]" : "text-[#6a7a70]"}`}>
                {rawCount}/{max}
                {format === "knockout" ? "・上から順にシード順になります" : ""}・1つ{TOURNAMENT_NAME_MAX}文字まで
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEntrantText(pickRandom(settings.entrants, settings.entrants.length).join("\n"))}
                disabled={settings.entrants.length < 2}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#e3e8e2] px-4 text-[12.5px] font-semibold text-[#4a5a50] disabled:opacity-40"
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden />
                順番をランダムにする（くじ引き）
              </button>
              {entrantText.trim() === "" ? (
                <button
                  type="button"
                  onClick={() => setEntrantText(SAMPLE.join("\n"))}
                  className="inline-flex min-h-[40px] items-center rounded-full px-3 text-[12.5px] font-semibold text-[#7b4fc9]"
                >
                  例を入れてみる
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === "basic" ? (
          <section className={card}>
            <h2 className="text-[18px] font-bold text-[#1e3828]">期間と見せ方</h2>
            <label className={labelCls}>
              ゲーム名 <span className="text-[11px] text-[#c8a84b]">必須</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 50))}
                placeholder="例：まちのフットサル大会"
                className={field}
              />
            </label>
            <div>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelCls}>
                  はじまり
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
                </label>
                <label className={labelCls}>
                  おわり
                  <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
                </label>
              </div>
              <PeriodPresets startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
            </div>
            <label className={labelCls}>
              説明 <span className="text-[11px] font-normal text-[#8a978f]">任意</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={2} className={`${field} resize-none`} />
            </label>
            <label className={labelCls}>
              対象イベント <span className="text-[11px] font-normal text-[#8a978f]">任意</span>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={field}>
                <option value="">選ばない</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="rounded-xl bg-[#f6f8f4] px-3.5 py-3 text-[12px] leading-[1.7] text-[#4a5a50]">
              参加用の QR を開くだけで、登録やログインをしなくても、だれでも対戦表を見られます。
            </p>
            <GameCardSetup
              type="tournament"
              typeLabel="トーナメント表"
              name={name}
              startDate={startDate}
              event={events.find((item) => item.id === eventId) ?? null}
              cardImage={cardImage}
              onCardImage={setCardImage}
            />
          </section>
        ) : null}

        {step === "publish" ? (
          <section className={card}>
            <h2 className="text-[18px] font-bold text-[#1e3828]">確認・公開</h2>
            <dl className="divide-y divide-[#f0f2ee] text-[13px]">
              {[
                ["形式", TOURNAMENT_FORMAT_LABELS[format]],
                ["出場者", `${settings.entrants.length}（${settings.entrants.slice(0, 4).join("・")}${settings.entrants.length > 4 ? " ほか" : ""}）`],
                ["試合の数", preview ? `${preview.total}試合` : "—"],
                ["ゲーム名", name || "（未入力）"],
                ["期間", `${startDate || "—"} 〜 ${endDate || "—"}`],
                ["対象イベント", events.find((item) => item.id === eventId)?.title ?? "選ばない"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 py-2.5">
                  <dt className="w-24 shrink-0 text-[#6a7a70]">{k}</dt>
                  <dd className="min-w-0 flex-1 font-semibold text-[#1e3828]">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-xl bg-[#f6f8f4] px-4 py-3 text-[12.5px] leading-[1.75] text-[#3a4a40]">
              <p className="font-semibold">公開したあとの流れ</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                <li>参加用の QR を会場に貼ったり、参加コードを案内したりします</li>
                <li>ゲームの管理画面で試合を押し、勝った方を入れると、次の試合に勝ち上がります</li>
                <li>参加者の画面は30秒ごとに新しくなります</li>
              </ol>
              <p className="mt-1.5 text-[11.5px] text-[#6a7a70]">公開したあとは、出場者の名前は直せますが、人数と並びは変えられません。</p>
            </div>
            <label className="flex items-start gap-2.5 rounded-xl border border-[#e3e8e2] px-3.5 py-3 text-[13px] text-[#1e3828]">
              <input type="checkbox" checked={confirmOk} onChange={(e) => setConfirmOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2e8a5a]" />
              <span>出場者の名前と並びを確認しました。</span>
            </label>
          </section>
        ) : null}
      </GameCreateShell>
      {testing ? (
        <GameTestSheet onClose={() => setTesting(false)}>
          <TournamentTryDemo format={format} entrants={settings.entrants} />
        </GameTestSheet>
      ) : null}
    </>
  );
}

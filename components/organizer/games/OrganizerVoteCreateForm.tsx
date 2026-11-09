"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks, PenLine, Rocket, Send, Sparkles, Trophy } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GameCardSetup, gameCardItem } from "@/components/organizer/games/GameCardSetup";
import { GameDraftLoading } from "@/components/organizer/games/GameDraftLoading";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import { GameTestSheet } from "@/components/organizer/games/GameTestSheet";
import { PeriodPresets, jstDate, periodProblem } from "@/components/organizer/games/PeriodPresets";
import { useGameDraft } from "@/components/organizer/games/useGameDraft";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  DEFAULT_VOTE_SETTINGS,
  VOTE_PHASES,
  VOTE_PRESET_MAX,
  sanitizePresetCandidates,
  sanitizeVoteSettings,
  type VotePhase,
  type VoteSettings,
} from "@/lib/organizer/vote";

const STEPS = [
  { id: "vote", label: "お題と決め方" },
  { id: "basic", label: "基本設定" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: ListChecks },
  { label: STEPS[1].label, icon: PenLine },
  { label: STEPS[2].label, icon: Rocket },
];

/** よくあるお題。押すとお題・ヒント・ゲーム名が入る */
const TEMPLATES: { label: string; name: string; prompt: string; guide: string; sample: string[] }[] = [
  {
    label: "名前を決める",
    name: "名前募集",
    prompt: "マスコットの名前を考えてください",
    guide: "呼びやすくて、まちらしい名前を待っています。",
    sample: ["まちぴょん", "めぶき", "グリフ"],
  },
  {
    label: "次の企画を決める",
    name: "次のイベントを決めよう",
    prompt: "次にやってほしいイベントは？",
    guide: "やってみたいこと、行ってみたい場所など、なんでもどうぞ。",
    sample: ["夜市", "川べりの音楽会", "親子の工作教室"],
  },
  {
    label: "好きな場所",
    name: "まちの好きな場所",
    prompt: "このまちでいちばん好きな場所は？",
    guide: "お店・公園・景色、なんでも大丈夫です。",
    sample: ["駅前のパン屋", "河川敷の夕日", "古い商店街"],
  },
  {
    label: "デザインを選ぶ",
    name: "デザイン投票",
    prompt: "ポスターに使ってほしい色やテーマは？",
    guide: "ひとことで書いてください。",
    sample: ["桜色", "夜空", "レトロ"],
  },
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

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[40px] flex-1 rounded-xl border px-2 text-[13px] font-semibold transition ${
        on ? "border-[#2e8a5a] bg-[#eaf4ee] text-[#226b46]" : "border-[#e3e8e2] bg-white text-[#4a5a50] hover:border-[#9cc9ad]"
      }`}
    >
      {children}
    </button>
  );
}

/** 参加者に見える画面の見本（段階ごと） */
function VotePhonePreview({
  name,
  vote,
  phase,
  sample,
}: {
  name: string;
  vote: VoteSettings;
  phase: VotePhase;
  sample: string[];
}) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[28px] border border-[#e3e8e2] bg-white p-4 shadow-[0_8px_28px_rgba(30,56,40,0.08)]">
      <p className="text-[11px] font-semibold text-[#2e8a5a]">投票</p>
      <p className="text-[17px] font-bold text-[#1e3828]">{name || "ゲーム名"}</p>
      <div className="mt-3 rounded-2xl bg-[#f6f8f4] px-3.5 py-3">
        <p className="text-[11px] font-semibold text-[#2e8a5a]">
          {phase === "collect" ? "案を募集中" : phase === "vote" ? "投票受付中" : "結果発表"}
        </p>
        <p className="mt-1 text-[15px] font-bold leading-snug text-[#1e3828]">{vote.prompt || "お題がここに出ます"}</p>
        {vote.guide && phase === "collect" ? <p className="mt-1 text-[12px] text-[#4a5a50]">{vote.guide}</p> : null}
      </div>
      {phase === "collect" ? (
        <>
          <div className="mt-3 rounded-xl border border-[#d8e4dc] px-3 py-2.5 text-[13px] text-[#9aa79f]">案を入力</div>
          <div className="mt-2 rounded-full bg-[#2e8a5a] py-2.5 text-center text-[13px] font-semibold text-white">案を送る</div>
          <p className="mt-2 text-center text-[11px] text-[#7a8a80]">あと {vote.maxIdeasPerPlayer} つ送れます</p>
        </>
      ) : null}
      {phase === "vote" ? (
        <ul className="mt-3 space-y-1.5">
          {sample.map((s, i) => (
            <li
              key={s}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13.5px] font-semibold ${
                i === 0 ? "border-[#2e8a5a] bg-[#eaf4ee]" : "border-[#e3e8e2]"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  i === 0 ? "border-[#2e8a5a] bg-[#2e8a5a] text-white" : "border-[#c7d3cb]"
                }`}
              >
                {i === 0 ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      {phase === "result" ? (
        <div className="mt-3">
          <div className="rounded-2xl bg-gradient-to-br from-[#fff6dc] to-[#fdf0c4] px-3 py-3 text-center">
            <Trophy className="mx-auto h-6 w-6 text-[#c9a227]" aria-hidden />
            <p className="text-[11px] font-semibold text-[#8a6510]">1位</p>
            <p className="text-[18px] font-bold text-[#3a2c06]">{sample[0]}</p>
          </div>
          <ol className="mt-2 space-y-1">
            {sample.map((s, i) => (
              <li key={s} className="flex justify-between rounded-lg border border-[#eef1ec] px-3 py-1.5 text-[12.5px]">
                <span>
                  {i + 1}位 {s}
                </span>
                <span className="text-[#6a7a70]">{[12, 8, 5][i] ?? 0}票</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

const DEMO_OTHERS: Record<string, number> = { あおば: 4, まちの灯: 3, ひだまり: 2 };

/** 「お試しで見る」：記録せずに、案を送る → 投票 → 結果をその場で試す */
function VoteTryDemo({ vote, name, preset = [] }: { vote: VoteSettings; name: string; preset?: string[] }) {
  const usePreset = preset.length >= 2;
  const [phase, setPhase] = useState<VotePhase>(usePreset ? "vote" : "collect");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const candidates = usePreset ? preset : [...ideas, ...Object.keys(DEMO_OTHERS)].slice(0, 6);
  const votes = (s: string) => (s === picked ? 1 : 0) + (DEMO_OTHERS[s] ?? 0);
  const ranked = [...candidates].sort((a, b) => votes(b) - votes(a));

  return (
    <div className="space-y-3 px-4 pb-6 pt-2">
      <div className="flex gap-1.5">
        {VOTE_PHASES.filter((p) => !usePreset || p.id !== "collect").map((p) => (
          <Choice key={p.id} on={phase === p.id} onClick={() => setPhase(p.id)}>
            {p.label}
          </Choice>
        ))}
      </div>
      <p className="text-[11.5px] text-[#6a7a70]">
        本番では、段階は主催者がゲームの管理画面から切りかえます。ここでは押して切りかえて試せます。
      </p>
      <div className="rounded-2xl bg-[#f6f8f4] px-4 py-3.5">
        <p className="text-[12px] font-semibold text-[#2e8a5a]">{name || "投票"}</p>
        <p className="mt-1 text-[16px] font-bold text-[#1e3828]">{vote.prompt || "お題を入れてください"}</p>
      </div>
      {phase === "collect" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text || ideas.length >= vote.maxIdeasPerPlayer || ideas.includes(text)) return;
            setIdeas((prev) => [...prev, text]);
            setDraft("");
          }}
          className="space-y-2"
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="案を入力" className={field} />
          <button
            type="submit"
            disabled={!draft.trim() || ideas.length >= vote.maxIdeasPerPlayer}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#2e8a5a] font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            案を送る
          </button>
          <p className="text-center text-[11.5px] text-[#7a8a80]">
            あと {Math.max(vote.maxIdeasPerPlayer - ideas.length, 0)} つ送れます
          </p>
          {ideas.length > 0 ? (
            <ul className="space-y-1">
              {ideas.map((s) => (
                <li key={s} className="rounded-lg border border-[#e3e8e2] px-3 py-2 text-[13.5px] font-semibold">
                  {s}
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      ) : null}
      {phase === "vote" ? (
        <ul className="space-y-1.5">
          {candidates.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setPicked((cur) => (cur === s ? null : s))}
                className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-3.5 text-left text-[14.5px] font-semibold ${
                  picked === s ? "border-[#2e8a5a] bg-[#eaf4ee]" : "border-[#e3e8e2] bg-white"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    picked === s ? "border-[#2e8a5a] bg-[#2e8a5a] text-white" : "border-[#c7d3cb]"
                  }`}
                >
                  {picked === s ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {phase === "result" ? (
        <ol className="space-y-1.5">
          {ranked.map((s, i) => (
            <li
              key={s}
              className="flex items-center justify-between rounded-xl border border-[#e8ece6] bg-white px-3 py-2 text-[14px]"
            >
              <span className="font-semibold">
                {i + 1}位 {s}
              </span>
              <span className="text-[#4a5a50]">{votes(s)}票</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** 投票ゲームの作成。お題 → 期間など → 公開。段階（案を集める・投票・結果）は公開後にゲームの管理画面から切りかえる */
export function OrganizerVoteCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("vote");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState("案を出し合って、いちばん人気の案を投票で決めます。");
  const [eventId, setEventId] = useState("");
  const [cardImage, setCardImage] = useState("");
  const [startDate, setStartDate] = useState(() => jstDate());
  const [endDate, setEndDate] = useState(() => jstDate(13));
  const [vote, setVote] = useState<VoteSettings>({ ...DEFAULT_VOTE_SETTINGS });
  /** 決まった候補から投票する（案を集めない） */
  const [presetMode, setPresetMode] = useState(false);
  const [candidateText, setCandidateText] = useState("");
  const [sample, setSample] = useState<string[]>(TEMPLATES[0].sample);
  const [previewPhase, setPreviewPhase] = useState<VotePhase>("collect");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [confirmOk, setConfirmOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const draft = useGameDraft((saved) => {
    setName(saved.name);
    setNameTouched(true);
    setDescription(saved.description);
    setEventId(saved.eventId);
    if (saved.startDate) setStartDate(saved.startDate);
    if (saved.endDate) setEndDate(saved.endDate);
    setCardImage(typeof saved.settings.cardImage === "string" ? saved.settings.cardImage : "");
    const restored = sanitizeVoteSettings(saved.settings.vote);
    setVote(restored);
    if (restored.presetCandidates.length > 0) {
      setPresetMode(true);
      setCandidateText(restored.presetCandidates.join("\n"));
    }
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

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const presetCandidates = presetMode ? sanitizePresetCandidates(candidateText.split("\n")) : [];
  const presetRawCount = candidateText.split("\n").filter((x) => x.trim()).length;
  const update = (patch: Partial<VoteSettings>) => setVote((prev) => ({ ...prev, ...patch }));
  /** 自分で直していなければ、ゲーム名をお題に合わせる */
  const effectiveName = nameTouched ? name : name || vote.prompt.slice(0, 30);

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    update({ prompt: t.prompt, guide: t.guide });
    setSample(t.sample);
    if (!nameTouched) setName(t.name);
  }

  function validate(id: StepId): string | null {
    if (id === "vote" && !vote.prompt.trim()) return "お題を入力するか、上の例から選んでください";
    if (id === "vote" && presetMode) {
      if (presetCandidates.length < 2) return "候補を2つ以上入れてください（1行に1つ）";
      if (presetRawCount > VOTE_PRESET_MAX) return `候補は${VOTE_PRESET_MAX}個までです`;
    }
    if (id === "basic") {
      if (!effectiveName.trim()) return "ゲーム名を入力してください";
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
    const message = validate("vote") ?? validate("basic");
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
          name: effectiveName.trim(),
          type: "vote",
          eventId: eventId || null,
          cardImage,
          // 投票はどこからでも参加コードで参加できるようにする
          participation: "remote",
          description: description.trim(),
          startsAt: toIso(startDate, "00:00"),
          endsAt: toIso(endDate, "23:59"),
          spots: [],
          vote: {
            ...vote,
            prompt: vote.prompt.trim(),
            presetCandidates,
            // 決まった候補のときは、案を集めずに投票から始める
            phase: presetMode ? "vote" : "collect",
          },
        },
        status,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (presetMode) {
        // 決まった候補を、投票の候補として入れる
        const res = await fetchWithTimeout(`/api/organizer/games/${result.id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync-preset" }),
        }).catch(() => null);
        if (!res || !res.ok) {
          const json = res ? await res.json().catch(() => ({})) : {};
          setError(
            (json as { error?: string }).error ??
              "候補を入れられませんでした。ゲームの管理画面で候補を確かめてください",
          );
          router.push(`/organizer/games/${result.id}`);
          return;
        }
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
        typeLabel="投票"
        card={gameCardItem({
          type: "vote",
          typeLabel: "投票",
          name: effectiveName,
          startDate,
          event: events.find((item) => item.id === eventId) ?? null,
          cardImage,
        })}
      />
    );
  }

  const preview = (
    <div className="space-y-3">
      <div className="mx-auto flex max-w-[320px] gap-1">
        {VOTE_PHASES.filter((p) => !presetMode || p.id !== "collect").map((p) => (
          <Choice key={p.id} on={previewPhase === p.id} onClick={() => setPreviewPhase(p.id)}>
            {p.label}
          </Choice>
        ))}
      </div>
      <VotePhonePreview
        name={effectiveName}
        vote={vote}
        phase={presetMode && previewPhase === "collect" ? "vote" : previewPhase}
        sample={presetMode && presetCandidates.length > 0 ? presetCandidates.slice(0, 3) : sample}
      />
    </div>
  );

  return (
    <>
      <GameCreateShell
        title="投票の作成"
        steps={SHELL_STEPS}
        step={stepIndex}
        onStep={(index) => {
          setError(null);
          setStep(STEPS[index].id);
        }}
        onNext={goNext}
        preview={preview}
        saving={saving}
        error={error}
        onTry={() => setTesting(true)}
        onDraft={() => void save("draft")}
        onPublish={() => void save("published")}
      >
        {step === "vote" ? (
          <section className={card}>
            <div>
              <h2 className="text-[18px] font-bold text-[#1e3828]">何を決めますか？</h2>
              <p className="mt-1 text-[12.5px] text-[#6a7a70]">例を押すと、お題とヒントが入ります。あとから自由に直せます。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
              {TEMPLATES.map((t) => {
                const on = vote.prompt === t.prompt;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    aria-pressed={on}
                    className={`flex min-h-[64px] flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2 text-left transition ${
                      on ? "border-[#2e8a5a] bg-[#eaf4ee]" : "border-[#e3e8e2] bg-white hover:border-[#9cc9ad]"
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[13px] font-bold text-[#1e3828]">
                      <Sparkles className="h-3.5 w-3.5 text-[#c9a227]" aria-hidden />
                      {t.label}
                    </span>
                    <span className="line-clamp-1 text-[11px] text-[#6a7a70]">{t.prompt}</span>
                  </button>
                );
              })}
            </div>
            <label className={labelCls}>
              お題 <span className="text-[11px] text-[#c8a84b]">必須</span>
              <input
                value={vote.prompt}
                onChange={(e) => update({ prompt: e.target.value.slice(0, 80) })}
                placeholder="例：マスコットの名前を考えてください"
                className={field}
              />
            </label>
            <div>
              <p className={labelCls}>決め方</p>
              <div className="mt-1.5 flex gap-1.5">
                <Choice on={!presetMode} onClick={() => setPresetMode(false)}>
                  案を集めてから投票
                </Choice>
                <Choice
                  on={presetMode}
                  onClick={() => {
                    setPresetMode(true);
                    setPreviewPhase("vote");
                  }}
                >
                  決まった候補から投票
                </Choice>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#6a7a70]">
                {presetMode
                  ? "候補を先に決めておき、公開したらすぐ投票できます。応募をメッセージなどで受けたときにも使えます。"
                  : "参加者から案を集め、その中から候補を選んで投票します。"}
              </p>
            </div>
            {presetMode ? (
              <label className={labelCls}>
                候補 <span className="text-[11px] text-[#c8a84b]">必須・2つ以上</span>
                <textarea
                  value={candidateText}
                  onChange={(e) => setCandidateText(e.target.value)}
                  rows={6}
                  placeholder={"まちぴょん\nめぶき\nグリフ"}
                  className={`${field} resize-y font-normal leading-[1.7]`}
                />
                <span className={`mt-1 block text-[11.5px] font-normal ${presetRawCount > VOTE_PRESET_MAX ? "text-[#b91c1c]" : "text-[#6a7a70]"}`}>
                  1行に1つ ・ {presetCandidates.length}/{VOTE_PRESET_MAX}
                </span>
              </label>
            ) : null}
            {!presetMode ? (
            <label className={labelCls}>
              案を書くときのヒント <span className="text-[11px] font-normal text-[#8a978f]">任意</span>
              <textarea
                value={vote.guide}
                onChange={(e) => update({ guide: e.target.value.slice(0, 200) })}
                rows={2}
                placeholder="例：呼びやすくて、まちらしい名前を待っています"
                className={`${field} resize-none`}
              />
            </label>
            ) : null}
            {!presetMode ? (
            <div>
              <p className={labelCls}>1人が送れる案</p>
              <div className="mt-1.5 flex gap-1.5">
                {[1, 2, 3, 5].map((n) => (
                  <Choice key={n} on={vote.maxIdeasPerPlayer === n} onClick={() => update({ maxIdeasPerPlayer: n })}>
                    {n}つ
                  </Choice>
                ))}
              </div>
            </div>
            ) : null}
            <div>
              <p className={labelCls}>1人の票の数</p>
              <div className="mt-1.5 flex gap-1.5">
                {[1, 2, 3].map((n) => (
                  <Choice key={n} on={vote.votesPerPlayer === n} onClick={() => update({ votesPerPlayer: n })}>
                    {n}票{n === 1 ? "（おすすめ）" : ""}
                  </Choice>
                ))}
              </div>
            </div>
            {!presetMode ? (
            <label className="flex items-center gap-2.5 rounded-xl bg-[#f6f8f4] px-3.5 py-3 text-[13px] text-[#1e3828]">
              <input
                type="checkbox"
                checked={vote.allowNote}
                onChange={(e) => update({ allowNote: e.target.checked })}
                className="h-4 w-4 accent-[#2e8a5a]"
              />
              案に「理由・ひとこと」を添えられるようにする
            </label>
            ) : null}
          </section>
        ) : null}

        {step === "basic" ? (
          <section className={card}>
            <h2 className="text-[18px] font-bold text-[#1e3828]">期間と見せ方</h2>
            <label className={labelCls}>
              ゲーム名 <span className="text-[11px] text-[#c8a84b]">必須</span>
              <input
                value={effectiveName}
                onChange={(e) => {
                  setNameTouched(true);
                  setName(e.target.value.slice(0, 50));
                }}
                placeholder="例：マスコットの名前募集"
                className={field}
              />
              {!nameTouched ? (
                <span className="mt-1 block text-[11px] font-normal text-[#8a978f]">お題から自動で入れています</span>
              ) : null}
            </label>
            <div>
              <div className="grid grid-cols-2 gap-3">
                <label className={labelCls}>
                  はじまり
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
                </label>
                <label className={labelCls}>
                  おわり
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={field}
                  />
                </label>
              </div>
              <PeriodPresets startDate={startDate} endDate={endDate} onStart={setStartDate} onEnd={setEndDate} />
            </div>
            <label className={labelCls}>
              説明 <span className="text-[11px] font-normal text-[#8a978f]">任意</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                rows={2}
                className={`${field} resize-none`}
              />
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
              参加者は、参加用の QR や参加コードから、どこからでも参加できます。1人1票にするため、MachiGlyph にログインして参加します。
            </p>
            <GameCardSetup
              type="vote"
              typeLabel="投票"
              name={effectiveName}
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
                ["お題", vote.prompt || "（未入力）"],
                ["ゲーム名", effectiveName || "（未入力）"],
                ["期間", `${startDate || "—"} 〜 ${endDate || "—"}`],
                presetMode
                  ? ["候補", `${presetCandidates.length}個（${presetCandidates.slice(0, 3).join("・")}${presetCandidates.length > 3 ? " ほか" : ""}）`]
                  : ["1人が送れる案", `${vote.maxIdeasPerPlayer}つまで`],
                ["1人の票の数", `${vote.votesPerPlayer}票`],
                ["対象イベント", events.find((item) => item.id === eventId)?.title ?? "選ばない"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 py-2.5">
                  <dt className="w-28 shrink-0 text-[#6a7a70]">{k}</dt>
                  <dd className="min-w-0 flex-1 font-semibold text-[#1e3828]">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-xl bg-[#f6f8f4] px-4 py-3 text-[12.5px] leading-[1.75] text-[#3a4a40]">
              <p className="font-semibold">公開したあとの流れ</p>
              {presetMode ? (
                <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                  <li>公開すると、すぐに候補から投票できます</li>
                  <li>候補はゲームの管理画面で足したり隠したりできます</li>
                  <li>投票が集まったら「結果発表」に切りかえると、参加者に1位が見えます</li>
                </ol>
              ) : (
              <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                <li>参加者が案を送ります</li>
                <li>ゲームの管理画面で、届いた案の ☆ を押して候補を選び、「投票」に切りかえます</li>
                <li>投票が集まったら「結果発表」に切りかえると、参加者に1位が見えます</li>
              </ol>
              )}
            </div>
            <label className="flex items-start gap-2.5 rounded-xl border border-[#e3e8e2] px-3.5 py-3 text-[13px] text-[#1e3828]">
              <input
                type="checkbox"
                checked={confirmOk}
                onChange={(e) => setConfirmOk(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#2e8a5a]"
              />
              <span>内容を確認しました。届いた案は管理画面で確かめ、ふさわしくない案は隠します。</span>
            </label>
          </section>
        ) : null}
      </GameCreateShell>
      {testing ? (
        <GameTestSheet onClose={() => setTesting(false)}>
          <VoteTryDemo vote={vote} name={effectiveName} preset={presetCandidates} />
        </GameTestSheet>
      ) : null}
    </>
  );
}

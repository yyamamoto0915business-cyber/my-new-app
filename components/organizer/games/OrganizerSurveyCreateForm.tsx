"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ClipboardList, PenLine, Plus, Rocket, Sparkles, Trash2 } from "lucide-react";
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
  DEFAULT_SURVEY_SETTINGS,
  SURVEY_LABEL_MAX,
  SURVEY_OPTION_LEN,
  SURVEY_OPTION_MAX,
  SURVEY_QUESTION_MAX,
  SURVEY_SCALE_LABELS,
  SURVEY_THANKS_MAX,
  SURVEY_TYPE_LABELS,
  newSurveyQuestionId,
  sanitizeSurveySettings,
  type SurveyQuestion,
  type SurveyQuestionType,
  type SurveySettings,
} from "@/lib/organizer/survey";

const STEPS = [
  { id: "questions", label: "質問" },
  { id: "basic", label: "基本設定" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: ClipboardList },
  { label: STEPS[1].label, icon: PenLine },
  { label: STEPS[2].label, icon: Rocket },
];

type Draft = Omit<SurveyQuestion, "id">;

/** よくあるアンケート。押すと質問がまとめて入る */
const TEMPLATES: { label: string; name: string; questions: Draft[] }[] = [
  {
    label: "イベントの感想",
    name: "イベントのアンケート",
    questions: [
      { label: "イベントの満足度を教えてください", type: "scale", required: true },
      { label: "よかったところは？", type: "multi", required: false, options: ["内容", "会場", "スタッフ", "時間", "料金"] },
      { label: "何で知りましたか？", type: "choice", required: false, options: ["MachiGlyph", "SNS", "チラシ・ポスター", "知り合いから", "その他"] },
      { label: "感想や、次にやってほしいことがあれば教えてください", type: "text", required: false },
    ],
  },
  {
    label: "お店・サービス",
    name: "ご利用アンケート",
    questions: [
      { label: "今日のご利用の満足度は？", type: "scale", required: true },
      { label: "また利用したいですか？", type: "choice", required: false, options: ["ぜひ", "たぶん", "わからない", "いいえ"] },
      { label: "ご意見・ご要望", type: "text", required: false },
    ],
  },
  {
    label: "日程を決める",
    name: "日程アンケート",
    questions: [
      { label: "参加できる日を選んでください", type: "multi", required: true, options: ["土曜の午前", "土曜の午後", "日曜の午前", "日曜の午後"] },
      { label: "ひとこと", type: "text", required: false },
    ],
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

/** 参加者に見える画面の見本（最初の3問） */
function SurveyPhonePreview({ name, survey }: { name: string; survey: SurveySettings }) {
  const questions = survey.questions.filter((q) => q.label.trim()).slice(0, 3);
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[28px] border border-[#e3e8e2] bg-white p-4 shadow-[0_8px_28px_rgba(30,56,40,0.08)]">
      <p className="text-[11px] font-semibold text-[#3a7bd5]">アンケート</p>
      <p className="text-[17px] font-bold text-[#1e3828]">{name || "ゲーム名"}</p>
      {questions.length === 0 ? (
        <p className="mt-3 rounded-xl bg-[#f6f8f4] px-3 py-4 text-center text-[12px] text-[#7a8a80]">質問がここに出ます</p>
      ) : (
        <div className="mt-3 space-y-2">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-[#eef1ec] px-3 py-2.5">
              <p className="text-[12.5px] font-bold text-[#1e3828]">
                <span className="mr-1 text-[11px] text-[#3a7bd5]">Q{i + 1}</span>
                {q.label}
              </p>
              {q.type === "scale" ? (
                <div className="mt-1.5 grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className="rounded-lg border border-[#e3e8e2] py-1 text-center text-[12px] font-bold">
                      {n}
                    </span>
                  ))}
                </div>
              ) : q.type === "text" ? (
                <div className="mt-1.5 h-8 rounded-lg border border-[#e3e8e2]" />
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {(q.options ?? []).filter(Boolean).slice(0, 3).map((o) => (
                    <li key={o} className="rounded-lg border border-[#e3e8e2] px-2 py-1 text-[11.5px]">
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {survey.questions.length > 3 ? (
            <p className="text-center text-[11px] text-[#7a8a80]">ほか {survey.questions.length - 3}問</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** 質問ひとつの編集 */
function QuestionEditor({
  q,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  q: SurveyQuestion;
  index: number;
  total: number;
  onChange: (patch: Partial<SurveyQuestion>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const options = q.options ?? [];
  return (
    <li className="space-y-2.5 rounded-2xl border border-[#e8ece6] bg-[#fbfcfa] p-3">
      <div className="flex items-start gap-1.5">
        <span className="mt-2.5 w-6 shrink-0 text-center text-[12px] font-bold text-[#3a7bd5]">Q{index + 1}</span>
        <input
          value={q.label}
          onChange={(e) => onChange({ label: e.target.value.slice(0, SURVEY_LABEL_MAX) })}
          placeholder="例：イベントの満足度を教えてください"
          className={`${field} mt-0 min-w-0 flex-1`}
          aria-label={`質問${index + 1}`}
        />
        <div className="flex shrink-0 flex-col">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="上へ" className="p-0.5 text-[#8a978f] disabled:opacity-30">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="下へ" className="p-0.5 text-[#8a978f] disabled:opacity-30">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <button type="button" onClick={onRemove} aria-label={`質問${index + 1}を消す`} className="mt-1.5 shrink-0 rounded-full p-1.5 text-[#8a978f] hover:text-[#b91c1c]">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pl-7">
        {(Object.keys(SURVEY_TYPE_LABELS) as SurveyQuestionType[]).map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={q.type === type}
            onClick={() =>
              onChange({
                type,
                options: type === "choice" || type === "multi" ? (options.length >= 2 ? options : ["", ""]) : undefined,
              })
            }
            className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${
              q.type === type ? "border-[#3a7bd5] bg-[#eef4fb] text-[#2a5ea8]" : "border-[#e3e8e2] bg-white text-[#4a5a50]"
            }`}
          >
            {SURVEY_TYPE_LABELS[type]}
          </button>
        ))}
        <label className="ml-1 flex items-center gap-1.5 text-[12px] text-[#4a5a50]">
          <input type="checkbox" checked={q.required} onChange={(e) => onChange({ required: e.target.checked })} className="h-3.5 w-3.5 accent-[#2e8a5a]" />
          必須
        </label>
      </div>
      {q.type === "choice" || q.type === "multi" ? (
        <div className="space-y-1.5 pl-7">
          {options.map((option, oi) => (
            <div key={oi} className="flex items-center gap-1.5">
              <input
                value={option}
                onChange={(e) => {
                  const next = [...options];
                  next[oi] = e.target.value.slice(0, SURVEY_OPTION_LEN);
                  onChange({ options: next });
                }}
                placeholder={`選択肢${oi + 1}`}
                className={`${field} mt-0 min-w-0 flex-1 py-2 text-[13px]`}
              />
              <button
                type="button"
                onClick={() => onChange({ options: options.filter((_, i) => i !== oi) })}
                disabled={options.length <= 2}
                aria-label={`選択肢${oi + 1}を消す`}
                className="shrink-0 p-1 text-[#8a978f] disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
          {options.length < SURVEY_OPTION_MAX ? (
            <button type="button" onClick={() => onChange({ options: [...options, ""] })} className="text-[12px] font-semibold text-[#3a7bd5]">
              ＋ 選択肢を足す
            </button>
          ) : null}
        </div>
      ) : q.type === "scale" ? (
        <p className="pl-7 text-[11.5px] text-[#6a7a70]">
          1（{SURVEY_SCALE_LABELS[0]}）〜 5（{SURVEY_SCALE_LABELS[4]}）から選んでもらい、平均も出します
        </p>
      ) : null}
    </li>
  );
}

/** アンケートの作成。質問 → 期間など → 公開。結果はゲームの管理画面で見る */
export function OrganizerSurveyCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("questions");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState("みなさんの感想や意見を聞かせてください。");
  const [eventId, setEventId] = useState("");
  const [cardImage, setCardImage] = useState("");
  const [startDate, setStartDate] = useState(() => jstDate());
  const [endDate, setEndDate] = useState(() => jstDate(13));
  const [survey, setSurvey] = useState<SurveySettings>({ ...DEFAULT_SURVEY_SETTINGS, questions: [] });
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
    setSurvey(sanitizeSurveySettings(saved.settings.survey));
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
  const cleaned = sanitizeSurveySettings(survey);
  const effectiveName = nameTouched ? name : name || (cleaned.questions.length > 0 ? "アンケート" : "");

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) =>
    setSurvey((prev) => ({ ...prev, questions: prev.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));

  function moveQuestion(index: number, dir: -1 | 1) {
    setSurvey((prev) => {
      const next = index + dir;
      if (next < 0 || next >= prev.questions.length) return prev;
      const qs = [...prev.questions];
      [qs[index], qs[next]] = [qs[next], qs[index]];
      return { ...prev, questions: qs };
    });
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    if (survey.questions.some((q) => q.label.trim()) && !window.confirm("今の質問を、例の質問に入れかえますか？")) return;
    setSurvey((prev) => ({ ...prev, questions: t.questions.map((q) => ({ ...q, id: newSurveyQuestionId() })) }));
    if (!nameTouched) setName(t.name);
  }

  function validate(id: StepId): string | null {
    if (id === "questions" && cleaned.questions.length === 0) return "質問を1つ以上入れるか、上の例から選んでください";
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
    const message = validate("questions") ?? validate("basic");
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
          type: "survey",
          eventId: eventId || null,
          cardImage,
          participation: "remote",
          description: description.trim(),
          startsAt: toIso(startDate, "00:00"),
          endsAt: toIso(endDate, "23:59"),
          spots: [],
          survey: { ...cleaned, phase: "open" },
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
        typeLabel="アンケート"
        card={gameCardItem({
          type: "survey",
          typeLabel: "アンケート",
          name: effectiveName,
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
        title="アンケートの作成"
        steps={SHELL_STEPS}
        step={stepIndex}
        onStep={(index) => {
          setError(null);
          setStep(STEPS[index].id);
        }}
        onNext={goNext}
        preview={<SurveyPhonePreview name={effectiveName} survey={survey} />}
        saving={saving}
        error={error}
        onTry={() => setTesting(true)}
        onDraft={() => void save("draft")}
        onPublish={() => void save("published")}
      >
        {step === "questions" ? (
          <section className={card}>
            <div>
              <h2 className="text-[18px] font-bold text-[#1e3828]">何を聞きますか？</h2>
              <p className="mt-1 text-[12.5px] text-[#6a7a70]">例を押すと、質問がまとめて入ります。あとから自由に直せます。</p>
            </div>
            <div className="grid grid-cols-1 gap-2 min-[600px]:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="flex min-h-[64px] flex-col items-start justify-center gap-0.5 rounded-xl border border-[#e3e8e2] bg-white px-3 py-2 text-left transition hover:border-[#9cc9ad]"
                >
                  <span className="flex items-center gap-1 text-[13px] font-bold text-[#1e3828]">
                    <Sparkles className="h-3.5 w-3.5 text-[#c9a227]" aria-hidden />
                    {t.label}
                  </span>
                  <span className="text-[11px] text-[#6a7a70]">{t.questions.length}問</span>
                </button>
              ))}
            </div>

            <ol className="space-y-2.5">
              {survey.questions.map((q, index) => (
                <QuestionEditor
                  key={q.id}
                  q={q}
                  index={index}
                  total={survey.questions.length}
                  onChange={(patch) => updateQuestion(q.id, patch)}
                  onMove={(dir) => moveQuestion(index, dir)}
                  onRemove={() => setSurvey((prev) => ({ ...prev, questions: prev.questions.filter((x) => x.id !== q.id) }))}
                />
              ))}
            </ol>
            {survey.questions.length < SURVEY_QUESTION_MAX ? (
              <button
                type="button"
                onClick={() =>
                  setSurvey((prev) => ({
                    ...prev,
                    questions: [...prev.questions, { id: newSurveyQuestionId(), label: "", type: "scale", required: false }],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-xl border border-dashed border-[#c7d3cb] px-3.5 py-2 text-[13px] font-semibold text-[#2e8a5a]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                質問を足す（あと{SURVEY_QUESTION_MAX - survey.questions.length}問）
              </button>
            ) : null}

            <label className={labelCls}>
              答えたあとのお礼 <span className="text-[11px] font-normal text-[#8a978f]">任意</span>
              <input
                value={survey.thanks}
                onChange={(e) => setSurvey((prev) => ({ ...prev, thanks: e.target.value.slice(0, SURVEY_THANKS_MAX) }))}
                className={field}
              />
            </label>
            <label className="flex items-center gap-2.5 rounded-xl bg-[#f6f8f4] px-3.5 py-3 text-[13px] text-[#1e3828]">
              <input
                type="checkbox"
                checked={survey.shareResults}
                onChange={(e) => setSurvey((prev) => ({ ...prev, shareResults: e.target.checked }))}
                className="h-4 w-4 accent-[#2e8a5a]"
              />
              答えた人に、みんなの結果（選択と5段階だけ）を見せる
            </label>
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
                placeholder="例：イベントのアンケート"
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
              参加者は、参加用の QR や参加コードから答えられます。1人1回にするため、MachiGlyph にログインして参加します。
            </p>
            <GameCardSetup
              type="survey"
              typeLabel="アンケート"
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
                ["質問", `${cleaned.questions.length}問`],
                ["ゲーム名", effectiveName || "（未入力）"],
                ["期間", `${startDate || "—"} 〜 ${endDate || "—"}`],
                ["結果を見せる", cleaned.shareResults ? "答えた人に見せる" : "主催者だけ"],
                ["対象イベント", events.find((item) => item.id === eventId)?.title ?? "選ばない"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 py-2.5">
                  <dt className="w-28 shrink-0 text-[#6a7a70]">{k}</dt>
                  <dd className="min-w-0 flex-1 font-semibold text-[#1e3828]">{v}</dd>
                </div>
              ))}
            </dl>
            <ol className="list-decimal space-y-0.5 rounded-xl bg-[#f6f8f4] py-3 pl-9 pr-4 text-[12.5px] text-[#3a4a40]">
              {cleaned.questions.map((q) => (
                <li key={q.id}>
                  {q.label}
                  <span className="ml-1 text-[11px] text-[#7a8a80]">（{SURVEY_TYPE_LABELS[q.type]}）</span>
                </li>
              ))}
            </ol>
            <label className="flex items-start gap-2.5 rounded-xl border border-[#e3e8e2] px-3.5 py-3 text-[13px] text-[#1e3828]">
              <input type="checkbox" checked={confirmOk} onChange={(e) => setConfirmOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2e8a5a]" />
              <span>内容を確認しました。答えはゲームの管理画面で見られ、CSV で保存できます。</span>
            </label>
          </section>
        ) : null}
      </GameCreateShell>
      {testing ? (
        <GameTestSheet onClose={() => setTesting(false)}>
          <div className="space-y-3 px-4 pb-6 pt-2">
            <p className="text-[12px] text-[#6a7a70]">参加者には、この順に質問が出ます（お試しでは答えは記録されません）。</p>
            <SurveyPhonePreview name={effectiveName} survey={survey} />
          </div>
        </GameTestSheet>
      ) : null}
    </>
  );
}

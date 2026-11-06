"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, Gift, PartyPopper, PenLine, Plus, Rocket, Sparkles, Trash2 } from "lucide-react";
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
  DEFAULT_LOTTERY_SETTINGS,
  LOTTERY_MESSAGE_MAX,
  LOTTERY_PRIZE_COUNT_MAX,
  LOTTERY_PRIZE_LABEL_MAX,
  LOTTERY_PRIZE_MAX,
  lotteryWinnerTotal,
  pickRandom,
  sanitizeLotterySettings,
  type LotteryPhase,
  type LotterySettings,
} from "@/lib/organizer/lottery";

const STEPS = [
  { id: "prizes", label: "賞と案内" },
  { id: "basic", label: "基本設定" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: Gift },
  { label: STEPS[1].label, icon: PenLine },
  { label: STEPS[2].label, icon: Rocket },
];

/** よくある抽選。押すと賞・案内・ゲーム名が入る */
const TEMPLATES: { label: string; name: string; prizes: { label: string; count: number }[]; message: string }[] = [
  {
    label: "プレゼント抽選",
    name: "プレゼント抽選会",
    prizes: [
      { label: "1等 商品券3,000円分", count: 1 },
      { label: "2等 地元のお菓子セット", count: 3 },
    ],
    message: "受付でこの画面と番号を見せて、景品を受け取ってください。",
  },
  {
    label: "1人だけ選ぶ",
    name: "当選者を1人選ぶ",
    prizes: [{ label: "当選", count: 1 }],
    message: "おめでとうございます！主催者から案内があるまで、少しお待ちください。",
  },
  {
    label: "参加賞つき",
    name: "お楽しみ抽選",
    prizes: [
      { label: "特賞 ペア食事券", count: 1 },
      { label: "参加賞 オリジナルステッカー", count: 20 },
    ],
    message: "会場の受付で、この画面を見せてください。",
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

/** 参加者に見える画面の見本（受付中・当選・はずれ） */
function LotteryPhonePreview({
  name,
  lottery,
  view,
}: {
  name: string;
  lottery: LotterySettings;
  view: "entry" | "won" | "lost";
}) {
  const prizes = lottery.prizes.filter((p) => p.label.trim());
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[28px] border border-[#e3e8e2] bg-white p-4 shadow-[0_8px_28px_rgba(30,56,40,0.08)]">
      <p className="text-[11px] font-semibold text-[#2e8a5a]">抽選</p>
      <p className="text-[17px] font-bold text-[#1e3828]">{name || "ゲーム名"}</p>
      {view === "entry" ? (
        <div className="mt-3 rounded-2xl bg-[#f6f8f4] px-3 py-4 text-center">
          <p className="text-[11px] font-semibold text-[#2e8a5a]">エントリーしました</p>
          <p className="mt-1 text-[26px] font-bold leading-none text-[#1e3828]">No.12</p>
          <p className="mt-2 text-[11px] text-[#4a5a50]">結果の発表まで、この画面を開いたまま待っていてください。</p>
        </div>
      ) : view === "won" ? (
        <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#fff1e6] to-[#ffe0dc] px-3 py-4 text-center">
          <PartyPopper className="mx-auto h-7 w-7 text-[#d9534f]" aria-hidden />
          <p className="mt-1 text-[11px] font-semibold text-[#a0403c]">おめでとうございます！</p>
          <p className="text-[17px] font-bold text-[#3a1a18]">{prizes[0]?.label || "賞の名前"}</p>
          <p className="text-[11px] text-[#6a3a36]">に当選しました</p>
          {lottery.winnerMessage ? (
            <p className="mt-2 rounded-lg bg-white/80 px-2 py-1.5 text-left text-[11px] text-[#3a1a18]">{lottery.winnerMessage}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-[#f3f5f2] px-3 py-4 text-center">
          <p className="text-[14px] font-bold text-[#1e3828]">今回は、はずれでした</p>
          <p className="mt-1 text-[11px] text-[#6a7a70]">参加してくれて、ありがとうございました。</p>
        </div>
      )}
      <ul className="mt-3 space-y-1">
        {(prizes.length > 0 ? prizes : [{ label: "賞の名前", count: 1 }]).map((p, i) => (
          <li key={`${p.label}-${i}`} className="flex justify-between rounded-lg border border-[#eef1ec] px-3 py-1.5 text-[12px]">
            <span className="font-semibold">{p.label}</span>
            <span className="text-[#6a7a70]">{p.count}人</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DEMO_NAMES = ["あおば", "まちの灯", "ひだまり", "こはる", "そら", "みどり", "たけのこ", "ゆず", "あなた"];

/** 「お試しで見る」：記録せずに、参加者9人で抽選してみる */
function LotteryTryDemo({ lottery }: { lottery: LotterySettings }) {
  const prizes = lottery.prizes.filter((p) => p.label.trim());
  const [winners, setWinners] = useState<{ prize: string; names: string[] }[] | null>(null);
  function run() {
    let pool = [...DEMO_NAMES];
    const result = prizes.map((p) => {
      const picked = pickRandom(pool, p.count);
      pool = pool.filter((n) => !picked.includes(n));
      return { prize: p.label, names: picked };
    });
    setWinners(result);
  }
  const mine = winners?.find((w) => w.names.includes("あなた"));
  return (
    <div className="space-y-3 px-4 pb-6 pt-2">
      <p className="text-[12px] text-[#6a7a70]">
        参加者が「{DEMO_NAMES.join("・")}」の {DEMO_NAMES.length}人いるとして、抽選してみます。本番では、ゲームの管理画面の「抽選する」で選びます。
      </p>
      <button
        type="button"
        onClick={run}
        disabled={prizes.length === 0}
        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#d9534f] font-semibold text-white disabled:opacity-50"
      >
        <Dices className="h-4 w-4" aria-hidden />
        {winners ? "もう一度抽選する" : "抽選する"}
      </button>
      {winners ? (
        <>
          <p className="rounded-xl bg-[#f6f8f4] px-3 py-2 text-center text-[13px] font-semibold text-[#1e3828]">
            「あなた」は {mine ? `${mine.prize} に当選！` : "はずれでした"}
          </p>
          <ul className="space-y-1.5">
            {winners.map((w, i) => (
              <li key={`${w.prize}-${i}`} className="rounded-xl border border-[#e8ece6] bg-white px-3 py-2 text-[13px]">
                <p className="font-bold text-[#1e3828]">{w.prize}</p>
                <p className="text-[#4a5a50]">{w.names.length > 0 ? w.names.join("、") : "（選べる人がいません）"}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** 抽選ゲームの作成。賞 → 期間など → 公開。抽選と結果発表は、公開後にゲームの管理画面から行う */
export function OrganizerLotteryCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("prizes");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState("参加した人の中から、抽選で当選者を選びます。");
  const [eventId, setEventId] = useState("");
  const [cardImage, setCardImage] = useState("");
  const [startDate, setStartDate] = useState(() => jstDate());
  const [endDate, setEndDate] = useState(() => jstDate(13));
  const [lottery, setLottery] = useState<LotterySettings>({
    ...DEFAULT_LOTTERY_SETTINGS,
    prizes: DEFAULT_LOTTERY_SETTINGS.prizes.map((p) => ({ ...p })),
  });
  const [previewView, setPreviewView] = useState<"entry" | "won" | "lost">("entry");
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
    const restored = sanitizeLotterySettings(saved.settings.lottery);
    setLottery(restored.prizes.length > 0 ? restored : { ...DEFAULT_LOTTERY_SETTINGS });
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
  const filledPrizes = lottery.prizes.filter((p) => p.label.trim());
  const effectiveName = nameTouched ? name : name || (filledPrizes.length > 0 ? "抽選会" : "");

  function updatePrize(index: number, patch: Partial<{ label: string; count: number }>) {
    setLottery((prev) => ({
      ...prev,
      prizes: prev.prizes.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setLottery((prev) => ({ ...prev, prizes: t.prizes.map((p) => ({ ...p })), winnerMessage: t.message }));
    if (!nameTouched) setName(t.name);
  }

  function validate(id: StepId): string | null {
    if (id === "prizes" && filledPrizes.length === 0) return "賞を1つ以上入れるか、上の例から選んでください";
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
    const message = validate("prizes") ?? validate("basic");
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
          type: "lottery",
          eventId: eventId || null,
          cardImage,
          // 抽選はどこからでも参加コードで参加できるようにする
          participation: "remote",
          description: description.trim(),
          startsAt: toIso(startDate, "00:00"),
          endsAt: toIso(endDate, "23:59"),
          spots: [],
          lottery: { ...lottery, phase: "entry" satisfies LotteryPhase },
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
        typeLabel="抽選"
        card={gameCardItem({
          type: "lottery",
          typeLabel: "抽選",
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
        {(
          [
            ["entry", "受付中"],
            ["won", "当選"],
            ["lost", "はずれ"],
          ] as const
        ).map(([id, label]) => (
          <Choice key={id} on={previewView === id} onClick={() => setPreviewView(id)}>
            {label}
          </Choice>
        ))}
      </div>
      <LotteryPhonePreview name={effectiveName} lottery={lottery} view={previewView} />
    </div>
  );

  return (
    <>
      <GameCreateShell
        title="抽選の作成"
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
        {step === "prizes" ? (
          <section className={card}>
            <div>
              <h2 className="text-[18px] font-bold text-[#1e3828]">どんな賞を用意しますか？</h2>
              <p className="mt-1 text-[12.5px] text-[#6a7a70]">例を押すと、賞と当選者への案内が入ります。あとから自由に直せます。</p>
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
                  <span className="line-clamp-1 text-[11px] text-[#6a7a70]">{t.prizes.map((p) => p.label).join("・")}</span>
                </button>
              ))}
            </div>

            <div>
              <p className={labelCls}>
                賞 <span className="text-[11px] text-[#c8a84b]">必須</span>
              </p>
              <ul className="mt-1.5 space-y-2">
                {lottery.prizes.map((prize, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <input
                      value={prize.label}
                      onChange={(e) => updatePrize(index, { label: e.target.value.slice(0, LOTTERY_PRIZE_LABEL_MAX) })}
                      placeholder={index === 0 ? "例：1等 商品券3,000円分" : "例：2等 お菓子セット"}
                      className={`${field} mt-0 min-w-0 flex-1`}
                      aria-label={`賞${index + 1}の名前`}
                    />
                    <label className="flex shrink-0 items-center gap-1 text-[13px] text-[#4a5a50]">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={LOTTERY_PRIZE_COUNT_MAX}
                        value={prize.count}
                        onChange={(e) =>
                          updatePrize(index, {
                            count: Math.min(LOTTERY_PRIZE_COUNT_MAX, Math.max(1, Number(e.target.value) || 1)),
                          })
                        }
                        className={`${field} mt-0 w-[72px] text-center`}
                        aria-label={`賞${index + 1}の人数`}
                      />
                      人
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLottery((prev) => ({ ...prev, prizes: prev.prizes.filter((_, i) => i !== index) }))
                      }
                      disabled={lottery.prizes.length <= 1}
                      aria-label={`賞${index + 1}を消す`}
                      className="shrink-0 rounded-full p-2 text-[#8a978f] hover:text-[#b91c1c] disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              {lottery.prizes.length < LOTTERY_PRIZE_MAX ? (
                <button
                  type="button"
                  onClick={() => setLottery((prev) => ({ ...prev, prizes: [...prev.prizes, { label: "", count: 1 }] }))}
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#2e8a5a]"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  賞を足す
                </button>
              ) : null}
              <p className="mt-2 text-[11.5px] text-[#6a7a70]">
                当選するのは合計 {lotteryWinnerTotal(filledPrizes)}人です。1人が当たるのは1つの賞までです。
              </p>
            </div>

            <label className={labelCls}>
              当選した人への案内 <span className="text-[11px] font-normal text-[#8a978f]">任意</span>
              <textarea
                value={lottery.winnerMessage}
                onChange={(e) => setLottery((prev) => ({ ...prev, winnerMessage: e.target.value.slice(0, LOTTERY_MESSAGE_MAX) }))}
                rows={2}
                placeholder="例：受付でこの画面と番号を見せて、景品を受け取ってください"
                className={`${field} resize-none`}
              />
              <span className="mt-1 block text-[11px] font-normal text-[#8a978f]">当たった人の画面にだけ出ます</span>
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
                placeholder="例：プレゼント抽選会"
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
              参加者は、参加用の QR や参加コードから参加すると、抽選にエントリーされます。1人1回にするため、MachiGlyph にログインして参加します。
            </p>
            <GameCardSetup
              type="lottery"
              typeLabel="抽選"
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
                ["賞", filledPrizes.map((p) => `${p.label}（${p.count}人）`).join("、") || "（未入力）"],
                ["ゲーム名", effectiveName || "（未入力）"],
                ["期間", `${startDate || "—"} 〜 ${endDate || "—"}`],
                ["当選した人への案内", lottery.winnerMessage || "なし"],
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
              <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                <li>参加者が参加用の QR から入ると、抽選にエントリーされます</li>
                <li>ゲームの管理画面で、賞ごとに「抽選する」を押すと当選者が決まります</li>
                <li>「結果を発表する」を押すと、参加者の画面に当たり・はずれが出ます</li>
              </ol>
            </div>
            <label className="flex items-start gap-2.5 rounded-xl border border-[#e3e8e2] px-3.5 py-3 text-[13px] text-[#1e3828]">
              <input
                type="checkbox"
                checked={confirmOk}
                onChange={(e) => setConfirmOk(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#2e8a5a]"
              />
              <span>内容を確認しました。景品は主催者が用意し、当選した人にお渡しします。</span>
            </label>
          </section>
        ) : null}
      </GameCreateShell>
      {testing ? (
        <GameTestSheet onClose={() => setTesting(false)}>
          <LotteryTryDemo lottery={lottery} />
        </GameTestSheet>
      ) : null}
    </>
  );
}

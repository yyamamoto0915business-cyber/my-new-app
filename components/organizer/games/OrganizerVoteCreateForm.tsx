"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ListChecks, PenLine, Rocket } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GameCardSetup, gameCardItem } from "@/components/organizer/games/GameCardSetup";
import { GameDraftLoading } from "@/components/organizer/games/GameDraftLoading";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import { jstDate, periodProblem } from "@/components/organizer/games/PeriodPresets";
import { useGameDraft } from "@/components/organizer/games/useGameDraft";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import { DEFAULT_VOTE_SETTINGS, sanitizeVoteSettings, type VoteSettings } from "@/lib/organizer/vote";

const STEPS = [
  { id: "basic", label: "基本設定" },
  { id: "vote", label: "お題と決め方" },
  { id: "publish", label: "確認・公開" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const SHELL_STEPS: GameCreateStep[] = [
  { label: STEPS[0].label, icon: PenLine },
  { label: STEPS[1].label, icon: ListChecks },
  { label: STEPS[2].label, icon: Rocket },
];

function toIso(date: string, time: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T${time || "00:00"}:00+09:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

const field = "mt-1 w-full rounded-xl border border-[#d8e4dc] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#2e8a5a]";
const label = "block text-[13px] font-semibold text-[#1e3828]";

/** 投票ゲームの作成。案を集める → 候補から投票 → 結果の流れで、段階は公開後にゲームの管理画面から切りかえる */
export function OrganizerVoteCreateForm() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("basic");
  const [name, setName] = useState("みんなで決めよう");
  const [description, setDescription] = useState("案を出し合って、いちばん人気の案を投票で決めます。");
  const [eventId, setEventId] = useState("");
  const [cardImage, setCardImage] = useState("");
  const [startDate, setStartDate] = useState(() => jstDate());
  const [endDate, setEndDate] = useState(() => jstDate(29));
  const [vote, setVote] = useState<VoteSettings>({
    ...DEFAULT_VOTE_SETTINGS,
    prompt: "",
  });
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [confirmOk, setConfirmOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const draft = useGameDraft((saved) => {
    setName(saved.name);
    setDescription(saved.description);
    setEventId(saved.eventId);
    if (saved.startDate) setStartDate(saved.startDate);
    if (saved.endDate) setEndDate(saved.endDate);
    setCardImage(typeof saved.settings.cardImage === "string" ? saved.settings.cardImage : "");
    setVote(sanitizeVoteSettings(saved.settings.vote));
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
  const update = (patch: Partial<VoteSettings>) => setVote((prev) => ({ ...prev, ...patch }));

  function validate(id: StepId): string | null {
    if (id === "basic") {
      if (!name.trim()) return "ゲーム名を入力してください";
      return periodProblem(startDate, endDate);
    }
    if (id === "vote" && !vote.prompt.trim()) return "お題を入力してください";
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
    const message = validate("basic") ?? validate("vote");
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
          type: "vote",
          eventId: eventId || null,
          cardImage,
          // 投票はどこからでも参加コードで参加できるようにする
          participation: "remote",
          description: description.trim(),
          startsAt: toIso(startDate, "00:00"),
          endsAt: toIso(endDate, "23:59"),
          spots: [],
          vote: { ...vote, prompt: vote.prompt.trim() },
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
        typeLabel="投票"
        card={gameCardItem({
          type: "vote",
          typeLabel: "投票",
          name,
          startDate,
          event: events.find((item) => item.id === eventId) ?? null,
          cardImage,
        })}
      />
    );
  }

  const preview = (
    <div className="mx-auto w-full max-w-[320px] rounded-[28px] border border-[#e3e8e2] bg-white p-4 shadow-[0_8px_28px_rgba(30,56,40,0.08)]">
      <p className="text-[11px] font-semibold text-[#2e8a5a]">投票</p>
      <p className="text-[17px] font-bold text-[#1e3828]">{name || "ゲーム名"}</p>
      <div className="mt-3 rounded-2xl bg-[#f6f8f4] px-3.5 py-3">
        <p className="text-[11px] font-semibold text-[#2e8a5a]">案を募集中</p>
        <p className="mt-1 text-[15px] font-bold leading-snug text-[#1e3828]">{vote.prompt || "お題がここに出ます"}</p>
        {vote.guide ? <p className="mt-1 text-[12px] text-[#4a5a50]">{vote.guide}</p> : null}
      </div>
      <div className="mt-3 rounded-xl border border-[#d8e4dc] px-3 py-2.5 text-[13px] text-[#9aa79f]">案を入力</div>
      <div className="mt-2 rounded-full bg-[#2e8a5a] py-2.5 text-center text-[13px] font-semibold text-white">案を送る</div>
      <p className="mt-2 text-center text-[11px] text-[#7a8a80]">あと {vote.maxIdeasPerPlayer} つ送れます</p>
    </div>
  );

  return (
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
      onTry={() => setError("投票は公開してから、参加画面で試せます（下書きのまま公開して、試したあとに段階を戻せます）")}
      onDraft={() => void save("draft")}
      onPublish={() => void save("published")}
    >
      {step === "basic" ? (
        <section className="space-y-4 rounded-2xl border border-[#e8ece6] bg-white p-5">
          <h2 className="text-[17px] font-bold text-[#1e3828]">基本設定</h2>
          <label className={label}>
            ゲーム名 <span className="text-[11px] text-[#c8a84b]">必須</span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} className={field} />
          </label>
          <label className={label}>
            説明
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              rows={3}
              className={`${field} resize-none`}
            />
          </label>
          <label className={label}>
            対象イベント
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={field}>
              <option value="">選ばない</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              はじまり
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={field} />
            </label>
            <label className={label}>
              おわり
              <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className={field} />
            </label>
          </div>
          <p className="text-[12px] leading-[1.7] text-[#6a7a70]">
            参加者は、参加用の QR や参加コードから、どこからでも参加できます。
          </p>
          <GameCardSetup
            type="vote"
            typeLabel="投票"
            name={name}
            startDate={startDate}
            event={events.find((item) => item.id === eventId) ?? null}
            cardImage={cardImage}
            onCardImage={setCardImage}
          />
        </section>
      ) : null}

      {step === "vote" ? (
        <section className="space-y-4 rounded-2xl border border-[#e8ece6] bg-white p-5">
          <h2 className="text-[17px] font-bold text-[#1e3828]">お題と決め方</h2>
          <label className={label}>
            お題 <span className="text-[11px] text-[#c8a84b]">必須</span>
            <input
              value={vote.prompt}
              onChange={(e) => update({ prompt: e.target.value.slice(0, 80) })}
              placeholder="例：マスコットの名前を考えてください"
              className={field}
            />
          </label>
          <label className={label}>
            案を書くときのヒント
            <textarea
              value={vote.guide}
              onChange={(e) => update({ guide: e.target.value.slice(0, 200) })}
              rows={2}
              placeholder="例：呼びやすくて、まちらしい名前を待っています"
              className={`${field} resize-none`}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              1人が送れる案
              <select
                value={vote.maxIdeasPerPlayer}
                onChange={(e) => update({ maxIdeasPerPlayer: Number(e.target.value) })}
                className={field}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}つまで
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              1人の票の数
              <select
                value={vote.votesPerPlayer}
                onChange={(e) => update({ votesPerPlayer: Number(e.target.value) })}
                className={field}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}票
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2.5 text-[13px] text-[#1e3828]">
            <input
              type="checkbox"
              checked={vote.allowNote}
              onChange={(e) => update({ allowNote: e.target.checked })}
              className="h-4 w-4"
            />
            案に「理由・ひとこと」を添えられるようにする
          </label>
          <div className="rounded-xl bg-[#f6f8f4] px-4 py-3 text-[12.5px] leading-[1.75] text-[#3a4a40]">
            <p className="font-semibold">決まるまでの流れ</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>案を集める：参加者が自由に案を送ります</li>
              <li>投票：届いた案から主催者が候補を選び、参加者が投票します</li>
              <li>結果発表：票の数と1位を参加者に見せます</li>
            </ol>
            <p className="mt-1.5 text-[#6a7a70]">段階は、公開したあとゲームの管理画面からいつでも切りかえられます。</p>
          </div>
        </section>
      ) : null}

      {step === "publish" ? (
        <section className="space-y-4 rounded-2xl border border-[#e8ece6] bg-white p-5">
          <h2 className="text-[17px] font-bold text-[#1e3828]">確認・公開</h2>
          <dl className="divide-y divide-[#f0f2ee] text-[13px]">
            {[
              ["ゲーム名", name],
              ["お題", vote.prompt || "（未入力）"],
              ["期間", `${startDate || "—"} 〜 ${endDate || "—"}`],
              ["1人が送れる案", `${vote.maxIdeasPerPlayer}つまで`],
              ["1人の票の数", `${vote.votesPerPlayer}票`],
              ["対象イベント", events.find((item) => item.id === eventId)?.title ?? "選ばない"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 py-2">
                <dt className="w-28 shrink-0 text-[#6a7a70]">{k}</dt>
                <dd className="min-w-0 flex-1 font-semibold text-[#1e3828]">{v}</dd>
              </div>
            ))}
          </dl>
          <label className="flex items-start gap-2.5 rounded-xl bg-[#f6f8f4] px-3.5 py-3 text-[13px] text-[#1e3828]">
            <input
              type="checkbox"
              checked={confirmOk}
              onChange={(e) => setConfirmOk(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              内容を確認しました。公開すると、参加者が案を送れるようになります。届いた案はゲームの管理画面で確かめ、
              ふさわしくない案は隠せます。
            </span>
          </label>
          {confirmOk ? (
            <p className="flex items-center gap-1.5 text-[12px] text-[#2e8a5a]">
              <Check className="h-3.5 w-3.5" aria-hidden />
              公開の準備ができました
            </p>
          ) : null}
        </section>
      ) : null}
    </GameCreateShell>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Camera,
  CircleHelp,
  Copy,
  Gift,
  MapPin,
  Pencil,
  PenLine,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import {
  QUIZ_CATEGORIES,
  QUIZ_FORMATS,
  createQuizQuestion,
  sampleQuizQuestions,
  type QuizFormatId,
  type QuizQuestion,
} from "@/lib/organizer/quiz";
import { QuizTestPlay } from "@/components/organizer/games/QuizTestPlay";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";

const STEPS: GameCreateStep[] = [
  { label: "基本情報", icon: PenLine },
  { label: "出題形式", icon: CircleHelp },
  { label: "問題", icon: BookOpen },
  { label: "達成条件・特典", icon: Gift },
];

function toIsoFromDate(date: string): string | null {
  if (!date) return null;
  const value = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

export function OrganizerQuizCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("まちの魅力発見！春のまち歩きクイズラリー");
  const [eventId, setEventId] = useState("");
  const [description, setDescription] = useState(
    "まち歩きながらクイズに挑戦して、地域の歴史やスポットの魅力を発見しよう！すべての問題に正解すると、素敵な特典がもらえます。"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [formats, setFormats] = useState<QuizFormatId[]>(["choice"]);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => sampleQuizQuestions());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [clearCount, setClearCount] = useState(3);
  const [couponOn, setCouponOn] = useState(true);
  const [prizeOn, setPrizeOn] = useState(false);
  const [rankingOn, setRankingOn] = useState(false);
  const [step, setStep] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout("/api/organizer/games?events=1&games=0", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        setEvents((json.events ?? []) as OrganizerGameEventOption[]);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const eventHint = useMemo(() => {
    if (loadingEvents) return "イベントを読み込み中です";
    if (events.length === 0) return "先にイベントを掲載すると、対象を選べます";
    return null;
  }, [loadingEvents, events.length]);

  const editing = questions.find((question) => question.key === editingKey) ?? null;

  function toggleFormat(id: QuizFormatId) {
    setFormats((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  function addQuestion() {
    const format = formats[0] ?? "choice";
    const next = createQuizQuestion(questions.length, format);
    setQuestions((current) => [...current, next]);
    setEditingKey(next.key);
    setPreviewIndex(questions.length);
  }

  function duplicateQuestion(key: string) {
    const source = questions.find((question) => question.key === key);
    if (!source) return;
    const copy: QuizQuestion = { ...source, key: crypto.randomUUID(), choices: [...source.choices] };
    const index = questions.findIndex((question) => question.key === key);
    setQuestions((current) => {
      const next = [...current];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function removeQuestion(key: string) {
    setQuestions((current) => current.filter((question) => question.key !== key));
    if (editingKey === key) setEditingKey(null);
  }

  function updateQuestion(key: string, patch: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.key === key ? { ...question, ...patch } : question))
    );
  }

  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    formats,
    questions: questions.map((question) => ({
      format: question.format,
      prompt: question.prompt,
      category: question.category,
      imageUrl: question.imageUrl,
      choices: question.choices,
      correctIndex: question.correctIndex,
      hint: question.hint,
    })),
    clearCount,
    rewards: { coupon: couponOn, prize: prizeOn, ranking: rankingOn },
  };

  async function save(status: "draft" | "published") {
    if (!name.trim()) {
      setError("ゲーム名を入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: "quiz",
          eventId: eventId || null,
          description: description.trim(),
          startsAt: toIsoFromDate(startDate),
          endsAt: toIsoFromDate(endDate),
          status,
          quiz: settingsBody,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "作成に失敗しました");
        return;
      }
      if (status === "published") {
        setPublished(true);
        return;
      }
      router.push("/organizer/games");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (published) {
    return (
      <div className="org-quiz">
        <GamePublishSuccess typeLabel="クイズラリー" />
      </div>
    );
  }

  return (
    <GameCreateShell
      title="クイズラリー作成"
      subtitle="まちの魅力を知ってもらえるクイズ体験を作成しましょう。"
      steps={STEPS}
      step={step}
      onStep={(next) => {
        setStep(next);
      }}
      saving={saving}
      error={error}
      onTry={() => setTesting(true)}
      onDraft={() => void save("draft")}
      onPublish={() => void save("published")}
      preview={
        <GamePhonePreview
          kind="quiz"
          typeLabel="クイズラリー"
          name={name}
          description={description}
          settings={settingsBody} focus={previewIndex}
          stepView={step === 0 ? "start" : step === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
      {step === 0 ? (
          <section className="org-quiz__card" aria-labelledby="quiz-basic">
            <h2 id="quiz-basic">基本情報</h2>
            <div className="org-quiz__grid">
              <label className="org-quiz__field org-quiz__field--wide">
                <span>
                  ゲーム名 <em>必須</em>
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  required
                />
                <small>{name.length}/80</small>
              </label>
              <label className="org-quiz__field">
                <span>対象イベント</span>
                <select value={eventId} onChange={(e) => setEventId(e.target.value)} disabled={loadingEvents}>
                  <option value="">あとで選ぶ</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                      {event.date ? `（${event.date}）` : ""}
                    </option>
                  ))}
                </select>
                {eventHint ? <small>{eventHint}</small> : null}
              </label>
              <label className="org-quiz__field">
                <span>開始日</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="org-quiz__field">
                <span>終了日</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
              <label className="org-quiz__field org-quiz__field--wide">
                <span>説明文</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <small>{description.length}/200</small>
              </label>
            </div>
          </section>
      ) : null}
      {step === 1 ? (
          <section className="org-quiz__card" aria-labelledby="quiz-formats">
            <h2 id="quiz-formats">出題形式</h2>
            <p>クイズの出題方法を選択してください。（複数の形式を組み合わせることもできます）</p>
            <ul className="org-quiz__formats">
              {QUIZ_FORMATS.map((format) => {
                const on = formats.includes(format.id);
                const Icon =
                  format.id === "choice"
                    ? BookOpen
                    : format.id === "ox"
                      ? CircleHelp
                      : format.id === "photo"
                        ? Camera
                        : MapPin;
                return (
                  <li key={format.id}>
                    <button
                      type="button"
                      className={cn("org-quiz__format", `is-${format.id}`, on && "is-on")}
                      onClick={() => toggleFormat(format.id)}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                      <strong>{format.label}</strong>
                      <span>{format.blurb}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
      ) : null}
      {step === 2 ? (
          <section className="org-quiz__card" aria-labelledby="quiz-list">
            <div className="org-quiz__card-head">
              <h2 id="quiz-list">クイズ一覧</h2>
              <button type="button" className="org-quiz__add" onClick={addQuestion}>
                <Plus className="h-4 w-4" aria-hidden />
                問題を追加する
              </button>
            </div>
            {questions.length === 0 ? (
              <p className="org-quiz__empty">まだ問題がありません。まちの魅力が伝わるクイズを追加しましょう。</p>
            ) : (
              <ol className="org-quiz__questions">
                {questions.map((question, index) => (
                  <li key={question.key}>
                    <button
                      type="button"
                      className="org-quiz__q-index"
                      aria-label={`${index + 1}問目をプレビュー`}
                      onClick={() => setPreviewIndex(index)}
                    >
                      {index + 1}
                    </button>
                    {question.imageUrl ? (
                      <span className="org-quiz__q-thumb">
                        <Image src={question.imageUrl} alt="" width={96} height={72} unoptimized />
                      </span>
                    ) : (
                      <span className="org-quiz__q-thumb is-empty" aria-hidden />
                    )}
                    <div className="org-quiz__q-body">
                      <p>{question.prompt || "問題文を入力してください"}</p>
                      <span>
                        <em>{question.category}</em>
                        <em>正答 {question.choices[question.correctIndex] || "未設定"}</em>
                      </span>
                    </div>
                    <div className="org-quiz__q-tools">
                      <button type="button" onClick={() => setEditingKey(question.key)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        編集
                      </button>
                      <button type="button" onClick={() => duplicateQuestion(question.key)}>
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                        複製
                      </button>
                      <button type="button" onClick={() => removeQuestion(question.key)}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        削除
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {editing ? (
              <div className="org-quiz__editor">
                <h3>問題を編集</h3>
                <label>
                  問題文
                  <textarea
                    value={editing.prompt}
                    onChange={(e) => updateQuestion(editing.key, { prompt: e.target.value })}
                    rows={3}
                  />
                </label>
                <div className="org-quiz__editor-row">
                  <label>
                    カテゴリ
                    <select
                      value={editing.category}
                      onChange={(e) => updateQuestion(editing.key, { category: e.target.value })}
                    >
                      {QUIZ_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    画像URL
                    <input
                      value={editing.imageUrl}
                      onChange={(e) => updateQuestion(editing.key, { imageUrl: e.target.value })}
                      placeholder="/profile/album/spring/town.jpg"
                    />
                  </label>
                </div>
                <ul className="org-quiz__editor-choices">
                  {editing.choices.map((choice, index) => (
                    <li key={`${editing.key}-choice-${index}`}>
                      <input
                        type="radio"
                        name={`correct-${editing.key}`}
                        checked={editing.correctIndex === index}
                        onChange={() => updateQuestion(editing.key, { correctIndex: index })}
                        aria-label="正答にする"
                      />
                      <input
                        value={choice}
                        onChange={(e) => {
                          const next = [...editing.choices];
                          next[index] = e.target.value;
                          updateQuestion(editing.key, { choices: next });
                        }}
                      />
                    </li>
                  ))}
                </ul>
                <label>
                  ヒント
                  <input
                    value={editing.hint}
                    onChange={(e) => updateQuestion(editing.key, { hint: e.target.value })}
                  />
                </label>
                <button type="button" className="org-quiz__editor-done" onClick={() => setEditingKey(null)}>
                  編集を閉じる
                </button>
              </div>
            ) : null}
          </section>
      ) : null}
      {step === 3 ? (
          <section className="org-quiz__card" aria-labelledby="quiz-rewards">
            <h2 id="quiz-rewards">達成条件・特典</h2>
            <p>クリア条件と、参加者への特典を設定します。</p>
            <ul className="org-quiz__rewards">
              <li className="is-on">
                <Trophy className="h-4 w-4" aria-hidden />
                <div>
                  <strong>3問以上正解でクリア</strong>
                  <span>指定した正解数でクリアとします</span>
                </div>
                <select value={clearCount} onChange={(e) => setClearCount(Number(e.target.value))}>
                  {Array.from({ length: Math.max(questions.length, 3) }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>
                      {count}問以上
                    </option>
                  ))}
                </select>
              </li>
              <li>
                <button type="button" className={cn("org-quiz__reward", couponOn && "is-on")} onClick={() => setCouponOn((on) => !on)}>
                  <Gift className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>クーポン付与</strong>
                    <span>クリア時にクーポンをプレゼント</span>
                  </div>
                </button>
              </li>
              <li>
                <button type="button" className={cn("org-quiz__reward", prizeOn && "is-on")} onClick={() => setPrizeOn((on) => !on)}>
                  <Gift className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>景品引換</strong>
                    <span>現地での景品引換を設定します</span>
                  </div>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={cn("org-quiz__reward", rankingOn && "is-on")}
                  onClick={() => setRankingOn((on) => !on)}
                >
                  <Trophy className="h-4 w-4" aria-hidden />
                  <div>
                    <strong>ランキング表示</strong>
                    <span>正解数やクリア時間で順位を表示します</span>
                  </div>
                </button>
              </li>
            </ul>
          </section>
      ) : null}
      {testing ? (
        <QuizTestPlay
          name={name}
          description={description}
          questions={questions}
          clearCount={clearCount}
          rewards={{ coupon: couponOn, prize: prizeOn, ranking: rankingOn }}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </GameCreateShell>
  );
}

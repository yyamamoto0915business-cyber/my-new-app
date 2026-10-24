"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  Gift,
  MapPin,
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
  quizFormatLabel,
  quizQuestionProblem,
  sampleQuizQuestions,
  type QuizFormatId,
  type QuizQuestion,
} from "@/lib/organizer/quiz";
import { QuizTestPlay } from "@/components/organizer/games/QuizTestPlay";
import { QuizCheckpointFields, QuizFormatChips } from "@/components/organizer/games/QuizQuestionSettings";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { GameImageField } from "@/components/organizer/games/GameImageField";
import { RewardFields } from "@/components/organizer/games/RewardFields";
import { ClearCountCard, RewardCard, RewardList } from "@/components/organizer/games/RewardOptions";
import { AudienceField, type GameAudienceChoice } from "@/components/organizer/games/AudienceField";
import { useGameLookEdit } from "@/components/organizer/games/useGameLookEdit";
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
  /** 参加できる人。イベント参加者・参加パス保有者に絞るときは、対象イベントが必要。 */
  const [audience, setAudience] = useState<GameAudienceChoice>("anyone");
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
  const { look, lookEdit } = useGameLookEdit();
  const [couponOn, setCouponOn] = useState(true);
  const [prizeOn, setPrizeOn] = useState(false);
  const [rankingOn, setRankingOn] = useState(false);
  const [couponName, setCouponName] = useState("");
  const [couponDetail, setCouponDetail] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizePlace, setPrizePlace] = useState("");
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
    const format = questions[questions.length - 1]?.format ?? formats[0] ?? "choice";
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

  function moveQuestion(key: string, direction: -1 | 1) {
    setQuestions((current) => {
      const from = current.findIndex((question) => question.key === key);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function updateQuestion(key: string, patch: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.key === key ? { ...question, ...patch } : question))
    );
  }

  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    // 問題で使っている形式も、出題形式に含めて残す。
    formats: QUIZ_FORMATS.map((format) => format.id).filter(
      (id) => formats.includes(id) || questions.some((question) => question.format === id),
    ),
    questions: questions.map((question) => ({
      format: question.format,
      prompt: question.prompt,
      category: question.category,
      imageUrl: question.imageUrl,
      choices: question.choices,
      correctIndex: question.correctIndex,
      hint: question.hint,
      ...(question.format === "checkin"
        ? {
            place: question.place,
            arrival: question.arrival,
            lat: question.lat,
            lng: question.lng,
            radius: question.radius,
            keyword: question.keyword,
          }
        : {}),
    })),
    clearCount,
    rewards: { coupon: couponOn, prize: prizeOn, ranking: rankingOn, couponName, couponDetail, prizeName, prizePlace },
  };

  async function save(status: "draft" | "published") {
    if (!name.trim()) {
      setError("ゲーム名を入力してください");
      return;
    }
    if (status === "published") {
      const problem = questions
        .map((question, index) => quizQuestionProblem(question, index + 1))
        .find((message) => message != null);
      if (problem) {
        setError(problem);
        setStep(2);
        return;
      }
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
          audience,
          description: description.trim(),
          startsAt: toIsoFromDate(startDate),
          endsAt: toIsoFromDate(endDate),
          status,
          quiz: settingsBody,
          look,
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
          settings={settingsBody}
          focus={previewIndex}
          edit={{
            onName: setName,
            onDescription: setDescription,
            quiz: {
              questions,
              index: previewIndex,
              onIndex: setPreviewIndex,
              onChange: updateQuestion,
              onAdd: addQuestion,
              onDuplicate: duplicateQuestion,
              onRemove: removeQuestion,
              onMove: moveQuestion,
              needed: Math.min(clearCount, Math.max(questions.length, 1)),
              formats,
            },
          }}
          look={lookEdit}
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
              <div className="org-quiz__field org-quiz__field--wide">
                <AudienceField value={audience} onChange={setAudience} eventChosen={Boolean(eventId)} />
              </div>
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
            <p>
              使う形式を選んでください。いくつでも選べます。複数選ぶと、問題ごとに形式を切り替えて、1つのクイズの中で組み合わせられます。
            </p>
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
                {questions.map((question, index) => {
                  const problem = quizQuestionProblem(question, index + 1);
                  const open = editingKey === question.key;
                  return (
                    <li key={question.key} className={cn(open && "is-open")}>
                      <button
                        type="button"
                        className="org-quiz__q-main"
                        aria-expanded={open}
                        onClick={() => {
                          setEditingKey(open ? null : question.key);
                          setPreviewIndex(index);
                        }}
                      >
                        <span className="org-quiz__q-index">{index + 1}</span>
                        {question.imageUrl ? (
                          <span className="org-quiz__q-thumb">
                            <Image src={question.imageUrl} alt="" width={96} height={72} unoptimized />
                          </span>
                        ) : (
                          <span className="org-quiz__q-thumb is-empty" aria-hidden />
                        )}
                        <span className="org-quiz__q-body">
                          <p>{question.prompt || "タップして問題文を入力"}</p>
                          <span>
                            <em>{quizFormatLabel(question.format)}</em>
                            <em>正答 {question.choices[question.correctIndex] || "未設定"}</em>
                            {problem ? <em className="is-warn">未入力あり</em> : null}
                          </span>
                        </span>
                      </button>
                      <div className="org-quiz__q-tools">
                        <button type="button" onClick={() => moveQuestion(question.key, -1)} disabled={index === 0} aria-label="上へ">
                          <ChevronUp className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveQuestion(question.key, 1)}
                          disabled={index === questions.length - 1}
                          aria-label="下へ"
                        >
                          <ChevronDown className="h-4 w-4" aria-hidden />
                        </button>
                        <button type="button" onClick={() => duplicateQuestion(question.key)} aria-label="複製">
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button type="button" onClick={() => removeQuestion(question.key)} aria-label="削除">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                      {open ? (
                        <div className="org-quiz__editor">
                          <QuizFormatChips
                            question={question}
                            allowed={formats}
                            onChange={(next) => updateQuestion(question.key, next)}
                          />
                          <QuizCheckpointFields
                            question={question}
                            map
                            onChange={(patch) => updateQuestion(question.key, patch)}
                          />
                          <label>
                            問題文
                            <textarea
                              autoFocus={!question.prompt}
                              value={question.prompt}
                              onChange={(e) => updateQuestion(question.key, { prompt: e.target.value })}
                              rows={2}
                              placeholder="例：このまちのシンボルは何でしょう？"
                            />
                          </label>
                          <div className="org-quiz__editor-answers">
                            <span>
                              {question.format === "ox" ? "正解をタップ" : "選択肢（正解の ● をタップ）"}
                            </span>
                            {question.format === "ox" ? (
                              <div className="org-quiz__ox">
                                {question.choices.map((choice, choiceIndex) => (
                                  <button
                                    key={choice}
                                    type="button"
                                    className={cn(question.correctIndex === choiceIndex && "is-on")}
                                    onClick={() => updateQuestion(question.key, { correctIndex: choiceIndex })}
                                  >
                                    {choiceIndex === 0 ? "○" : "×"}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <ul className="org-quiz__editor-choices">
                                {question.choices.map((choice, choiceIndex) => (
                                  <li key={`${question.key}-choice-${choiceIndex}`}>
                                    <input
                                      type="radio"
                                      name={`correct-${question.key}`}
                                      checked={question.correctIndex === choiceIndex}
                                      onChange={() => updateQuestion(question.key, { correctIndex: choiceIndex })}
                                      aria-label="正答にする"
                                    />
                                    <input
                                      value={choice}
                                      onChange={(e) => {
                                        const next = [...question.choices];
                                        next[choiceIndex] = e.target.value;
                                        updateQuestion(question.key, { choices: next });
                                      }}
                                      placeholder={`選択肢 ${choiceIndex + 1}`}
                                    />
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <details className="org-quiz__more">
                            <summary>写真・ヒント・カテゴリ（任意）</summary>
                            <GameImageField
                              label="問題の写真"
                              url={question.imageUrl}
                              onChange={(imageUrl) => updateQuestion(question.key, { imageUrl })}
                            />
                            <label>
                              ヒント
                              <input
                                value={question.hint}
                                onChange={(e) => updateQuestion(question.key, { hint: e.target.value })}
                              />
                            </label>
                            <label>
                              カテゴリ
                              <select
                                value={question.category}
                                onChange={(e) => updateQuestion(question.key, { category: e.target.value })}
                              >
                                {QUIZ_CATEGORIES.map((category) => (
                                  <option key={category}>{category}</option>
                                ))}
                              </select>
                            </label>
                          </details>
                          <button type="button" className="org-quiz__editor-done" onClick={() => setEditingKey(null)}>
                            できた
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
      ) : null}
      {step === 3 ? (
          <section className="org-quiz__card" aria-labelledby="quiz-rewards">
            <h2 id="quiz-rewards">達成条件・特典</h2>
            <p>クリア条件と、参加者への特典を設定します。</p>
            <RewardList>
              <ClearCountCard
                icon={Trophy}
                title={`${Math.min(clearCount, Math.max(questions.length, 1))}問以上正解でクリア`}
                desc="問題の数までの中から選べます"
                value={Math.min(clearCount, Math.max(questions.length, 1))}
                max={questions.length}
                unit="問以上"
                onChange={setClearCount}
              />
              <RewardCard
                icon={Gift}
                title="クーポン付与"
                desc="クリアした人に、1人ずつ違うコードのクーポンを出します"
                on={couponOn}
                onChange={setCouponOn}
              >
                <RewardFields
                  fields={[
                    { label: "クーポンの名前", value: couponName, onChange: setCouponName, max: 40, placeholder: "例：コーヒー1杯無料" },
                    { label: "内容・使い方", value: couponDetail, onChange: setCouponDetail, max: 80, placeholder: "例：参加店でお会計のときに見せてください" },
                  ]}
                  note="使ったかどうかは、ゲームの管理画面で記録できます。"
                />
              </RewardCard>
              <RewardCard
                icon={Gift}
                title="景品引換"
                desc="クリアした人が、現地で景品と引き換えられます"
                on={prizeOn}
                onChange={setPrizeOn}
              >
                <RewardFields
                  fields={[
                    { label: "景品の名前", value: prizeName, onChange: setPrizeName, max: 40, placeholder: "例：オリジナル手ぬぐい" },
                    { label: "受け取り場所", value: prizePlace, onChange: setPrizePlace, max: 60, placeholder: "例：駅前の観光案内所" },
                  ]}
                  note="引き換えコードを出します。渡したら、管理画面で引き換え済みにできます。"
                />
              </RewardCard>
              <RewardCard
                icon={Trophy}
                title="ランキング表示"
                desc="正解数の多い順に順位を出します（同じ数なら、早くクリアした人が上）"
                on={rankingOn}
                onChange={setRankingOn}
              />
            </RewardList>
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


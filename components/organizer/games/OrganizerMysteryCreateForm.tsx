"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp, Copy, Gift, PenLine, Plus, Search, Trash2, Trophy } from "lucide-react";
import { GameImageField } from "@/components/organizer/games/GameImageField";
import { RewardFields } from "@/components/organizer/games/RewardFields";
import { AudienceField, type GameAudienceChoice } from "@/components/organizer/games/AudienceField";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { OrganizerGameEventOption } from "@/lib/organizer/games";
import { ClearCountCard, RewardCard, RewardList } from "@/components/organizer/games/RewardOptions";
import { ArrivalFields } from "@/components/organizer/games/ArrivalFields";
import { cn } from "@/lib/utils";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
import { useGameLookEdit } from "@/components/organizer/games/useGameLookEdit";
import { GameCreateShell, type GameCreateStep } from "@/components/organizer/games/GameCreateShell";
import { GamePublishSuccess } from "@/components/organizer/games/GamePublishSuccess";
import { MysteryTestPlay } from "@/components/organizer/games/MysteryTestPlay";
import { createMysteryStep, sampleMysterySteps, type MysteryStep } from "@/lib/organizer/mystery";

const STEPS: GameCreateStep[] = [
  { label: "基本情報", icon: PenLine },
  { label: "謎", icon: Search },
  { label: "クリア", icon: Trophy },
];

export function OrganizerMysteryCreateForm() {
  const { look, lookEdit } = useGameLookEdit();
  const router = useRouter();
  const [name, setName] = useState("春のまちの謎解き");
  const [description, setDescription] = useState("ヒントを順にたどって、三つの謎を解く短いさんぽです。");
  const [steps, setSteps] = useState<MysteryStep[]>(() => sampleMysterySteps());
  const [clearCount, setClearCount] = useState(3);
  const [couponOn, setCouponOn] = useState(true);
  const [prizeOn, setPrizeOn] = useState(false);
  const [couponName, setCouponName] = useState("");
  const [couponDetail, setCouponDetail] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizePlace, setPrizePlace] = useState("");
  const [page, setPage] = useState(0);
  /** 対象イベントと、参加できる人（イベント参加者・参加パス保有者に絞るときは、対象イベントが必要）。 */
  const [eventId, setEventId] = useState("");
  const [audience, setAudience] = useState<GameAudienceChoice>("anyone");
  const [events, setEvents] = useState<OrganizerGameEventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
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
  /** 開いて編集している謎（プレビューもこの謎を出す）。 */
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const ready = steps.filter((step) => step.prompt.trim() && step.answer.trim());
  /** 選べるのは、答えのある謎の数まで。 */
  const clearShown = Math.min(clearCount, Math.max(ready.length, 1));

  function updateStep(key: string, patch: Partial<MysteryStep>) {
    setSteps((current) => current.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  }
  function addStep() {
    const next = createMysteryStep();
    setSteps((current) => [...current, next]);
    setOpenKey(next.key);
    setPreviewIndex(steps.length);
  }
  function moveStep(key: string, delta: number) {
    setSteps((current) => {
      const index = current.findIndex((step) => step.key === key);
      const to = index + delta;
      if (index < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item!);
      setPreviewIndex(to);
      return next;
    });
  }
  function duplicateStep(key: string) {
    setSteps((current) => {
      const index = current.findIndex((step) => step.key === key);
      if (index < 0 || current.length >= 20) return current;
      const copy = { ...current[index]!, key: crypto.randomUUID() };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      setOpenKey(copy.key);
      setPreviewIndex(index + 1);
      return next;
    });
  }
  function removeStep(key: string) {
    setSteps((current) => (current.length > 1 ? current.filter((step) => step.key !== key) : current));
    if (openKey === key) setOpenKey(null);
    setPreviewIndex(0);
  }

  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    steps: steps.map(({ key: _key, ...step }) => step),
    clearCount,
    couponOn,
    prizeOn,
    couponName,
    couponDetail,
    prizeName,
    prizePlace,
  };

  async function save(status: "draft" | "published") {
    if (!name.trim()) {
      setError("名前を入れてください");
      return;
    }
    if (status === "published" && audience !== "anyone" && !eventId) {
      setError("参加できる人を絞るときは、対象イベントを選んでください");
      setPage(0);
      return;
    }
    if (status === "published" && ready.length === 0) {
      setError("答えのある謎を1つ入れてから公開できます");
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
          type: "mystery",
          description: description.trim(),
          status,
          mystery: settingsBody,
          look,
          eventId: eventId || null,
          audience,
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

  if (published) return <GamePublishSuccess typeLabel="謎解き街歩き" />;

  return (
    <GameCreateShell
      title="謎解き街歩き作成"
      subtitle="ヒントを順にたどって、まちを歩きます。答えは、参加する人の画面には出しません。"
      steps={STEPS}
      step={page}
      onStep={setPage}
      saving={saving}
      error={error}
      onTry={() => setTesting(true)}
      onDraft={() => void save("draft")}
      onPublish={() => void save("published")}
      preview={
        <GamePhonePreview
          kind="mystery"
          typeLabel="謎解き街歩き"
          name={name}
          description={description}
          settings={settingsBody}
          look={lookEdit}
          focus={previewIndex}
          stepView={page === 0 ? "start" : page === STEPS.length - 1 ? "clear" : "play"}
        />
      }
    >
      {page === 0 ? (
          <section className="org-quiz__card">
            <h2>基本情報</h2>
            <label className="org-quiz__field org-quiz__field--wide">
              <span>名前</span>
              <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="org-quiz__field org-quiz__field--wide">
              <span>説明</span>
              <textarea value={description} maxLength={400} rows={3} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="org-quiz__field org-quiz__field--wide">
              <span>対象イベント（任意）</span>
              <select value={eventId} disabled={loadingEvents} onChange={(event) => setEventId(event.target.value)}>
                <option value="">あとで選ぶ</option>
                {events.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                    {item.date ? `（${item.date}）` : ""}
                  </option>
                ))}
              </select>
              <small>
                {loadingEvents
                  ? "イベントを読み込み中です"
                  : events.length === 0
                    ? "先にイベントを掲載すると、対象を選べます"
                    : "選ぶと、イベントのページからこのゲームに入れます。"}
              </small>
            </label>
            <div className="org-quiz__field org-quiz__field--wide">
              <AudienceField value={audience} onChange={setAudience} eventChosen={Boolean(eventId)} />
            </div>
          </section>
      ) : null}
      {page === 1 ? (
          <section className="org-quiz__card" aria-labelledby="mystery-list">
            <div className="org-quiz__card-head">
              <h2 id="mystery-list">謎の一覧</h2>
              <button type="button" className="org-quiz__add" onClick={addStep} disabled={steps.length >= 20}>
                <Plus className="h-4 w-4" aria-hidden />
                謎を追加する
              </button>
            </div>
            <p style={{ margin: "0.2rem 0 0.6rem", fontSize: "0.78rem", color: "#66726a" }}>
              参加者は好きな謎から解けます。番号は一覧と地図での並びです。押すと開いて編集でき、右のプレビューにもその謎が出ます。
            </p>
            <ol className="org-quiz__questions">
              {steps.map((step, index) => {
                const open = openKey === step.key;
                const missing =
                  !step.prompt.trim() ||
                  !step.answer.trim() ||
                  (step.arrival === "gps" && (step.lat == null || step.lng == null)) ||
                  (step.arrival === "keyword" && !step.keyword.trim());
                return (
                  <li key={step.key} className={cn(open && "is-open")}>
                    <button
                      type="button"
                      className="org-quiz__q-main"
                      aria-expanded={open}
                      onClick={() => {
                        setOpenKey(open ? null : step.key);
                        setPreviewIndex(index);
                      }}
                    >
                      <span className="org-quiz__q-index">{index + 1}</span>
                      {step.imageUrl ? (
                        <span className="org-quiz__q-thumb">
                          <Image src={step.imageUrl} alt="" width={96} height={72} unoptimized />
                        </span>
                      ) : (
                        <span className="org-quiz__q-thumb is-empty" aria-hidden />
                      )}
                      <span className="org-quiz__q-body">
                        <p>{step.prompt || "タップして謎の文を入力"}</p>
                        <span>
                          <em>{step.place.trim() || "場所は未設定"}</em>
                          {step.lat == null || step.lng == null ? <em>地図の場所なし</em> : <em>地図に出ます</em>}
                          {step.arrival !== "none" ? <em>{step.arrival === "gps" ? "着いたら開く（GPS）" : "着いたら開く（合言葉）"}</em> : null}
                          <em>答え {step.answer.trim() || "未設定"}</em>
                          {missing ? <em className="is-warn">未入力あり</em> : null}
                        </span>
                      </span>
                    </button>
                    <div className="org-quiz__q-tools">
                      <button type="button" onClick={() => moveStep(step.key, -1)} disabled={index === 0} aria-label="上へ">
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(step.key, 1)}
                        disabled={index === steps.length - 1}
                        aria-label="下へ"
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      </button>
                      <button type="button" onClick={() => duplicateStep(step.key)} disabled={steps.length >= 20} aria-label="複製">
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button type="button" onClick={() => removeStep(step.key)} disabled={steps.length <= 1} aria-label="削除">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    {open ? (
                      <div className="org-quiz__editor">
                        {!step.prompt.trim() || !step.answer.trim() ? (
                          <p style={{ margin: 0, padding: "0.5rem 0.7rem", borderRadius: "0.7rem", background: "#fff4dc", color: "#8a5a00", fontSize: "0.75rem", fontWeight: 700 }}>
                            「謎の文」と「答え」を入れると、プレビューと参加者の画面（マップも）に出ます。
                          </p>
                        ) : null}
                        <label>
                          場所
                          <input
                            value={step.place}
                            maxLength={40}
                            placeholder="例：さくら通りの入口"
                            onChange={(event) => updateStep(step.key, { place: event.target.value })}
                          />
                        </label>
                        <ArrivalFields
                          value={step}
                          itemLabel="謎"
                          arrivalNote="その場所に着くまで、参加者には謎の文と写真を見せません。場所の名前は、着く前から見えます。"
                          onChange={(patch) => updateStep(step.key, patch)} />
                        <label>
                          謎の文
                          <textarea
                            autoFocus={!step.prompt}
                            value={step.prompt}
                            maxLength={120}
                            rows={2}
                            placeholder="例：春に、このまちでいちばん先に咲く花は？"
                            onChange={(event) => updateStep(step.key, { prompt: event.target.value })}
                          />
                        </label>
                        <label>
                          答え
                          <input
                            value={step.answer}
                            maxLength={24}
                            placeholder="例：桜"
                            onChange={(event) => updateStep(step.key, { answer: event.target.value })}
                          />
                          <small style={{ color: "#7b877f", fontWeight: 500 }}>参加する人の画面には出ません。この言葉を入れると正解です。</small>
                        </label>
                        <label>
                          ヒント（まちがえたときに出す）
                          <input
                            value={step.hint}
                            maxLength={80}
                            placeholder="例：ピンクの花です。"
                            onChange={(event) => updateStep(step.key, { hint: event.target.value })}
                          />
                        </label>
                        <GameImageField
                          label="謎の写真"
                          url={step.imageUrl}
                          onChange={(imageUrl) => updateStep(step.key, { imageUrl })}
                        />
                        <button type="button" className="org-quiz__editor-done" onClick={() => setOpenKey(null)}>
                          できた
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {steps.length < 20 ? (
              <button type="button" className="org-quiz__add" style={{ width: "100%", marginTop: "0.6rem" }} onClick={addStep}>
                <Plus className="h-4 w-4" aria-hidden />
                謎を追加する
              </button>
            ) : null}
          </section>
      ) : null}
      {page === 2 ? (
          <section className="org-quiz__card">
            <h2>達成条件・特典</h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#66726a" }}>
              好きな順に解けます。決めた数を解くとクリアです。
            </p>
            <RewardList>
              <ClearCountCard
                icon={Trophy}
                title={`${clearShown}問解いたらクリア`}
                desc="答えのある謎の数までの中から選べます"
                value={clearShown}
                max={ready.length}
                unit="問"
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
            </RewardList>
          </section>
      ) : null}
      {testing ? (
        <MysteryTestPlay
          name={name}
          description={description}
          steps={steps}
          clearCount={clearCount}
          couponOn={couponOn}
          prizeOn={prizeOn}
          onClose={() => setTesting(false)}
        />
      ) : null}
    </GameCreateShell>
  );
}


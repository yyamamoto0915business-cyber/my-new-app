"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Plus, Search, Trash2, Trophy } from "lucide-react";
import { GamePhonePreview } from "@/components/organizer/games/GamePhonePreview";
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
  const router = useRouter();
  const [name, setName] = useState("春のまちの謎解き");
  const [description, setDescription] = useState("ヒントを順にたどって、三つの謎を解く短いさんぽです。");
  const [steps, setSteps] = useState<MysteryStep[]>(() => sampleMysterySteps());
  const [clearCount, setClearCount] = useState(3);
  const [couponOn, setCouponOn] = useState(true);
  const [prizeOn, setPrizeOn] = useState(false);
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const ready = steps.filter((step) => step.prompt.trim() && step.answer.trim());

  function updateStep(key: string, patch: Partial<MysteryStep>) {
    setSteps((current) => current.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  }

  /** 保存で送る設定。プレビューも同じものから描く。 */
  const settingsBody = {
    steps: steps.map(({ place, prompt, answer, hint, imageUrl, published: stepPublished }) => ({
      place,
      prompt,
      answer,
      hint,
      imageUrl,
      published: stepPublished,
    })),
    clearCount,
    couponOn,
    prizeOn,
  };

  async function save(status: "draft" | "published") {
    if (!name.trim()) {
      setError("名前を入れてください");
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
          </section>
      ) : null}
      {page === 1 ? (
          <section className="org-quiz__card">
            <div className="org-quiz__card-head">
              <h2>謎</h2>
              <button
                type="button"
                className="org-quiz__try"
                onClick={() => setSteps((current) => [...current, createMysteryStep()])}
                disabled={steps.length >= 20}
              >
                <Plus className="h-4 w-4" aria-hidden />
                謎を足す
              </button>
            </div>
            {steps.map((step, index) => (
              <div key={step.key} className="org-quiz__field org-quiz__field--wide">
                <span>
                  {index + 1}. {step.place.trim() || "場所は未設定"}
                </span>
                <input
                  value={step.place}
                  maxLength={40}
                  placeholder="場所"
                  aria-label={`${index + 1}問目の場所`}
                  onChange={(event) => updateStep(step.key, { place: event.target.value })}
                />
                <textarea
                  value={step.prompt}
                  maxLength={120}
                  rows={2}
                  placeholder="謎の文"
                  aria-label={`${index + 1}問目の謎`}
                  onChange={(event) => updateStep(step.key, { prompt: event.target.value })}
                />
                <input
                  value={step.answer}
                  maxLength={24}
                  placeholder="答え"
                  aria-label={`${index + 1}問目の答え`}
                  onChange={(event) => updateStep(step.key, { answer: event.target.value })}
                />
                <input
                  value={step.hint}
                  maxLength={80}
                  placeholder="まちがえたときに出すヒント"
                  aria-label={`${index + 1}問目のヒント`}
                  onChange={(event) => updateStep(step.key, { hint: event.target.value })}
                />
                {steps.length > 1 ? (
                  <button type="button" className="org-quiz__back" onClick={() => setSteps((current) => current.filter((item) => item.key !== step.key))}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    この謎を消す
                  </button>
                ) : null}
              </div>
            ))}
          </section>
      ) : null}
      {page === 2 ? (
          <section className="org-quiz__card">
            <h2>クリア</h2>
            <label className="org-quiz__field">
              <span>何問でクリア</span>
              <input
                type="number"
                min={1}
                max={Math.max(ready.length, 1)}
                value={clearCount}
                onChange={(event) => setClearCount(Number(event.target.value) || 1)}
              />
            </label>
            <label className="org-quiz__field">
              <span>
                <input type="checkbox" checked={couponOn} onChange={(event) => setCouponOn(event.target.checked)} />
                クーポンの案内を出す
              </span>
            </label>
            <label className="org-quiz__field">
              <span>
                <input type="checkbox" checked={prizeOn} onChange={(event) => setPrizeOn(event.target.checked)} />
                景品の案内を出す
              </span>
            </label>
            <p>順に解きます。クリアの案内は、この画面の言葉までです。</p>
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

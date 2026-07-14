"use client";

import { useMemo, useState } from "react";
import {
  filterPassesByTab,
  getNextPass,
  getOtherPasses,
  PASS_TABS,
  SAMPLE_PARTICIPATION_PASSES,
  type PassTabId,
  type ParticipationPass,
} from "@/lib/participation-pass";
import { PassListCard } from "@/components/pass/PassListCard";
import { PassDetailPanel } from "@/components/pass/PassDetailPanel";
import { PassDetailDrawer } from "@/components/pass/PassDetailDrawer";

type Props = {
  passes?: ParticipationPass[];
};

export function ParticipationPassView({
  passes = SAMPLE_PARTICIPATION_PASSES,
}: Props) {
  const [activeTab, setActiveTab] = useState<PassTabId>("upcoming");
  const [selectedPassId, setSelectedPassId] = useState<string | null>(
    () => getNextPass(passes)?.id ?? passes[0]?.id ?? null
  );
  const [isPassDetailOpen, setIsPassDetailOpen] = useState(false);

  const tabPasses = useMemo(
    () => filterPassesByTab(passes, activeTab),
    [passes, activeTab]
  );

  const nextPass = useMemo(
    () => (activeTab === "upcoming" ? getNextPass(tabPasses) : null),
    [activeTab, tabPasses]
  );

  const otherPasses = useMemo(
    () =>
      activeTab === "upcoming"
        ? getOtherPasses(tabPasses, nextPass?.id ?? null)
        : tabPasses,
    [activeTab, tabPasses, nextPass]
  );

  const selectedPass =
    passes.find((p) => p.id === selectedPassId) ?? nextPass ?? passes[0] ?? null;

  const selectPass = (id: string) => {
    setSelectedPassId(id);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches) {
      setIsPassDetailOpen(true);
    }
  };

  const openPass = (id: string) => {
    setSelectedPassId(id);
    setIsPassDetailOpen(true);
  };

  const closeDetail = () => {
    setIsPassDetailOpen(false);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col px-5 pb-3 pt-0 min-[900px]:px-7 min-[900px]:pb-3 min-[900px]:pt-1">
      {/* モバイル用：見出し＋タブ（PCでは左カラム内に表示） */}
      <header className="mb-2 shrink-0 min-[900px]:hidden">
        <h1 className="text-[20px] font-semibold tracking-tight text-[#1a2818]">
          参加パス
        </h1>
        <p className="mt-0.5 text-[12.5px] leading-snug text-[#5a665c]">
          申し込み済み・取得済みのイベント参加パスを確認できます
        </p>
      </header>

      <div
        className="mb-3 flex shrink-0 gap-0.5 border-b border-[#e4ebe4] min-[900px]:hidden"
        role="tablist"
        aria-label="参加パスの絞り込み"
      >
        {PASS_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative -mb-px px-3.5 py-1.5 text-[13px] font-medium transition ${
                active ? "text-[#2d7a4f]" : "text-[#6a7468] hover:text-[#3a4840]"
              }`}
            >
              {tab.label}
              {active && (
                <span
                  className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-[#4a9a68]"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 min-[900px]:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)] min-[900px]:items-start min-[900px]:gap-7">
        {/* 左：見出し＋一覧 */}
        <section aria-label="参加パス一覧" className="min-w-0 space-y-3">
          <div className="hidden min-[900px]:block">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1a2818]">
              参加パス
            </h1>
            <p className="mt-0.5 text-[12.5px] leading-snug text-[#5a665c]">
              申し込み済み・取得済みのイベント参加パスを確認できます
            </p>
            <div
              className="mt-2.5 flex gap-0.5 border-b border-[#e4ebe4]"
              role="tablist"
              aria-label="参加パスの絞り込み"
            >
              {PASS_TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative -mb-px px-3.5 py-1.5 text-[13px] font-medium transition ${
                      active ? "text-[#2d7a4f]" : "text-[#6a7468] hover:text-[#3a4840]"
                    }`}
                  >
                    {tab.label}
                    {active && (
                      <span
                        className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-[#4a9a68]"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "upcoming" && nextPass && (
            <div>
              <h2 className="mb-1.5 text-[12.5px] font-semibold text-[#3a4840]">
                次の参加予定
              </h2>
              <PassListCard
                pass={nextPass}
                size="featured"
                selected={selectedPassId === nextPass.id}
                onSelect={() => selectPass(nextPass.id)}
                onOpenPass={() => openPass(nextPass.id)}
              />
            </div>
          )}

          {otherPasses.length > 0 && (
            <div>
              <h2 className="mb-1.5 text-[12.5px] font-semibold text-[#3a4840]">
                {activeTab === "upcoming"
                  ? "その他の参加予定"
                  : activeTab === "today"
                    ? "本日の参加パス"
                    : "過去の参加パス"}
              </h2>
              <div className="space-y-2">
                {otherPasses.map((pass) => (
                  <PassListCard
                    key={pass.id}
                    pass={pass}
                    size="compact"
                    selected={selectedPassId === pass.id}
                    onSelect={() => selectPass(pass.id)}
                    onOpenPass={() => openPass(pass.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {tabPasses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#d8e2d8] bg-white/60 px-6 py-10 text-center">
              <p className="text-[14px] font-medium text-[#3a4840]">
                {activeTab === "today"
                  ? "本日開催の参加パスはありません"
                  : activeTab === "history"
                    ? "参加履歴はまだありません"
                    : "これからの参加予定はありません"}
              </p>
              <p className="mt-2 text-[12.5px] text-[#6a7468]">
                イベントに申し込むと、ここに参加パスが表示されます
              </p>
            </div>
          )}
        </section>

        {/* 右：詳細（PC）— ページ先頭から開始して「低い」印象を解消 */}
        <aside
          aria-label="選択中の参加パス"
          className="hidden min-h-0 min-w-0 min-[900px]:flex min-[900px]:flex-col"
        >
          <PassDetailPanel pass={selectedPass} onClose={closeDetail} />
        </aside>
      </div>

      <PassDetailDrawer
        open={isPassDetailOpen}
        pass={selectedPass}
        onClose={closeDetail}
      />
    </div>
  );
}

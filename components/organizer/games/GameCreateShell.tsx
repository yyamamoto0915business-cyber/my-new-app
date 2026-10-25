"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Smartphone, type LucideIcon } from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { cn } from "@/lib/utils";
import styles from "./StampRallyWizard.module.css";
import "./wizard-preview.css";

export type GameCreateStep = { label: string; icon: LucideIcon };

/**
 * スタンプラリー以外のゲーム作成で共通の枠。
 * スタンプラリーと同じく、ステップごとに1画面ずつ進み、下に操作ボタン、
 * PCは右にプレビュー、スマホは右下のボタンから全画面のプレビューを開く。
 */
export function GameCreateShell({
  title,
  steps,
  step,
  onStep,
  onNext,
  preview,
  saving,
  error,
  onTry,
  onDraft,
  onPublish,
  children,
}: {
  title: string;
  steps: readonly GameCreateStep[];
  /** 0 から。 */
  step: number;
  onStep: (step: number) => void;
  /** 「次へ」で入力を確かめたいとき。なければそのまま次のステップへ。 */
  onNext?: () => void;
  /** 参加者に見える画面。なければプレビューを出さない。 */
  preview?: ReactNode;
  saving: boolean;
  error: string | null;
  onTry: () => void;
  onDraft: () => void;
  onPublish: () => void;
  children: ReactNode;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const last = step >= steps.length - 1;
  /** 下へスクロールしているあいだは、右下のプレビューのボタンを隠す（スイッチや入力欄に重ならないように）。 */
  const [fabHidden, setFabHidden] = useState(false);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      setFabHidden(y > lastY && y > 120);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!previewOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [previewOpen]);

  function go(next: number) {
    onStep(Math.min(Math.max(next, 0), steps.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={cn("org-game-create", styles.wizard)}>
      <div className={styles.layout} style={preview ? undefined : { gridTemplateColumns: "minmax(0, 1fr)" }}>
        <div className={styles.main}>
          <Link
            href="/organizer/games"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
            ゲーム機能に戻る
          </Link>

          <div className="hidden md:block">
            <OrganizerWorkspacePageHeader title={title} />
          </div>

          <nav className={styles.stepper} aria-label="作成ステップ">
            <div className={styles.stepperHead}>
              <span className={styles.stepperCount}>
                STEP <b>{step + 1}</b>
                <i>/ {steps.length}</i>
              </span>
              <span className={styles.stepperTitle}>{steps[step]?.label}</span>
              {!last ? <span className={styles.stepperNext}>次：{steps[step + 1]?.label}</span> : null}
            </div>
            <ol
              className={styles.stepperTrack}
              style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
            >
              {steps.map((item, index) => {
                const current = step === index;
                const done = step > index;
                const Icon = item.icon;
                return (
                  <li
                    key={item.label}
                    className={cn(styles.stepperItem, current && styles["is-current"], done && styles["is-done"])}
                  >
                    <button
                      type="button"
                      aria-current={current ? "step" : undefined}
                      title={item.label}
                      aria-label={`${index + 1}. ${item.label}${done ? "（済み）" : ""}`}
                      onClick={() => go(index)}
                    >
                      <span className={styles.stepperDot}>
                        {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                      </span>
                      <span className={styles.stepperLabel}>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          {children}
          {error ? <p className="org-quiz__error">{error}</p> : null}
          <div className={styles.footer}>
            <p className={styles.footerStep}>
              <b>STEP {step + 1} / {steps.length}</b>
              {steps[step]?.label}
              {!last ? <span>次：{steps[step + 1]?.label}</span> : null}
            </p>
            <div className={styles.footerQuiet}>
              {step > 0 ? (
                <button type="button" className={styles.textAction} disabled={saving} onClick={() => go(step - 1)}>
                  戻る
                </button>
              ) : null}
              <button type="button" className={styles.textAction} disabled={saving} onClick={onTry}>
                お試しで見る
              </button>
              <button type="button" className={styles.textAction} disabled={saving} onClick={onDraft}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                下書き保存
              </button>
            </div>
            <button
              type="button"
              className={styles.primary}
              disabled={saving}
              onClick={() => {
                if (last) onPublish();
                else if (onNext) {
                  onNext();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else go(step + 1);
              }}
            >
              {last ? "公開する" : "次へ"}
            </button>
          </div>
        </div>
        {preview ? (
          <aside className={styles.livePreview} aria-label="参加者画面プレビュー">
            <div className={styles.livePreviewHead}>
              <p className={styles.livePreviewTitle}>参加者に見える画面</p>
            </div>
            {preview}
          </aside>
        ) : null}
      </div>

      {preview ? (
        <button
          type="button"
          className={cn("wizard-preview-fab", styles.previewFab)}
          onClick={() => setPreviewOpen(true)}
          style={{
            transition: "transform 0.2s ease, opacity 0.2s ease",
            transform: fabHidden ? "translateY(160%)" : undefined,
            opacity: fabHidden ? 0 : 1,
            pointerEvents: fabHidden ? "none" : undefined,
          }}
        >
          <Smartphone className="h-4 w-4" aria-hidden />
          プレビュー
        </button>
      ) : null}
      {preview && previewOpen
        ? createPortal(
            <div className="wizard-preview-sheet game-create-sheet" role="dialog" aria-modal="true" aria-label="参加者画面プレビュー">
              <div className="wizard-preview-sheet__head">
                <b>参加者に見える画面</b>
                <button type="button" onClick={() => setPreviewOpen(false)}>
                  編集にもどる
                </button>
              </div>
              <div className="game-create-sheet__body">{preview}</div>
            </div>,
            document.body,
          )
        : null}

    </div>
  );
}

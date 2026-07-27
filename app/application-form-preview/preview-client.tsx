"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ApplicationFormPcView } from "@/components/recruitments/ApplicationFormPcView";
import { ApplicationFormMobileView } from "@/components/recruitments/ApplicationFormMobileView";
import { type ApplicationFormAnswers } from "@/lib/recruitment-application-form";
import { buildApplicationFormPreview } from "@/lib/application-form-preview";
import { cn } from "@/lib/utils";

/**
 * ログイン不要の応募フォームプレビュー（PC / モバイル切替）。
 * 送信・下書きはローカル状態のみ（APIは呼ばない）。
 * ?view=mobile でモバイル表示。
 */
export function ApplicationFormPreviewClient() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view") === "mobile" ? "mobile" : "pc";
  const [view, setView] = useState<"pc" | "mobile">(viewParam);
  const preview = useMemo(() => buildApplicationFormPreview(), []);
  const [answers, setAnswers] = useState<ApplicationFormAnswers>(preview.initialAnswers);
  const [draftSaved, setDraftSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setView(viewParam);
  }, [viewParam]);

  const setField = (id: string, value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setDraftSaved(false);
  };

  const sharedHandlers = {
    onChange: setField,
    onBack: () => setToast("プレビューのため戻るは無効です"),
    onSaveDraft: () => {
      setDraftSaved(true);
      setToast("下書きを保存しました（プレビュー・保存先なし）");
    },
    onSubmit: (e: React.FormEvent) => {
      e.preventDefault();
      setToast("応募を受け付けました（プレビュー・送信なし）");
    },
  };

  return (
    <div className="flex h-[calc(100dvh-var(--mg-pc-top-nav-h,52px))] flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-center gap-3 border-b border-[#d8ecd0] bg-[#f3faf0] px-4 py-1.5">
        <p className="text-[11px] font-medium text-[#3a633d]">
          {view === "mobile" ? "プレビュー：モバイル応募フォーム" : preview.bannerLabel}
        </p>
        <div className="flex rounded-md border border-[#c5d9bc] bg-white p-0.5 text-[11px]">
          <Link
            href="/application-form-preview"
            className={cn(
              "rounded px-2.5 py-0.5 font-medium",
              view === "pc" ? "bg-[#3a633d] text-white" : "text-[#3a633d] hover:bg-[#f3faf0]"
            )}
          >
            PC
          </Link>
          <Link
            href="/application-form-preview?view=mobile"
            className={cn(
              "rounded px-2.5 py-0.5 font-medium",
              view === "mobile" ? "bg-[#3a633d] text-white" : "text-[#3a633d] hover:bg-[#f3faf0]"
            )}
          >
            モバイル
          </Link>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 overflow-auto", view === "mobile" && "bg-white")}>
        {view === "pc" ? (
          <ApplicationFormPcView
            recruitmentId={preview.recruitmentId}
            recruitment={preview.recruitment}
            config={preview.config}
            answers={answers}
            profile={preview.profile}
            email={preview.email}
            error={null}
            submitting={false}
            savingDraft={false}
            draftSaved={draftSaved}
            forceShow
            lockedRoleNames={preview.lockedRoleNames}
            {...sharedHandlers}
          />
        ) : (
          <div className="min-h-full bg-white">
            <ApplicationFormMobileView
              recruitment={preview.recruitment}
              config={preview.config}
              answers={answers}
              profile={preview.profile}
              email={preview.email}
              error={null}
              submitting={false}
              savingDraft={false}
              draftSaved={draftSaved}
              forceShow
              {...sharedHandlers}
            />
          </div>
        )}
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg border border-[#d8e0d4] bg-white px-4 py-2.5 text-[13px] text-[#1a2818] shadow-lg"
        >
          {toast}
          <button
            type="button"
            className="ml-3 text-[12px] font-medium text-[#2B3A6B] underline"
            onClick={() => setToast(null)}
          >
            閉じる
          </button>
        </div>
      ) : null}
    </div>
  );
}

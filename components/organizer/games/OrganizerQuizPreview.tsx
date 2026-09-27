"use client";

import Image from "next/image";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/organizer/quiz";

type Props = {
  name: string;
  previewTab: "quiz" | "clear";
  onPreviewTab: (tab: "quiz" | "clear") => void;
  activeQuestion: QuizQuestion | null;
  questionIndex: number;
  questionTotal: number;
};

export function OrganizerQuizPreview({
  name,
  previewTab,
  onPreviewTab,
  activeQuestion,
  questionIndex,
  questionTotal,
}: Props) {
  const title = name.trim() || "クイズラリー";
  const prompt = activeQuestion?.prompt.trim() || "問題を追加すると、ここに表示されます。";
  const choices = activeQuestion?.choices.filter((choice) => choice.trim()) ?? [];
  const hint = activeQuestion?.hint.trim() ?? "";

  return (
    <aside className="org-quiz__preview">
      <div className="org-quiz__preview-head">
        <h2>参加者プレビュー</h2>
        <p>実際の参加画面のイメージです。</p>
      </div>
      <div className="org-quiz__preview-tabs" role="tablist" aria-label="プレビュー切替">
        <button
          type="button"
          role="tab"
          aria-selected={previewTab === "quiz"}
          className={cn(previewTab === "quiz" && "is-on")}
          onClick={() => onPreviewTab("quiz")}
        >
          クイズ画面
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={previewTab === "clear"}
          className={cn(previewTab === "clear" && "is-on")}
          onClick={() => onPreviewTab("clear")}
        >
          クリア画面
        </button>
      </div>
      <div className="org-quiz__phone">
        <div className="org-quiz__phone-bar" aria-hidden>
          <span>9:41</span>
        </div>
        {previewTab === "quiz" ? (
          <div className="org-quiz__screen">
            <div className="org-quiz__screen-top">
              <p>{title}</p>
              <span>
                {questionTotal > 0 ? `${questionIndex + 1} / ${questionTotal}` : "0 / 0"}
              </span>
            </div>
            {activeQuestion ? (
              <>
                {activeQuestion.category ? (
                  <em className="org-quiz__chip">{activeQuestion.category}</em>
                ) : null}
                {activeQuestion.imageUrl ? (
                  <div className="org-quiz__screen-photo">
                    <Image src={activeQuestion.imageUrl} alt="" width={640} height={400} unoptimized />
                  </div>
                ) : null}
                <h3>{prompt}</h3>
                <ul className="org-quiz__choices">
                  {(choices.length > 0 ? choices : ["選択肢"]).map((choice, index) => (
                    <li key={`${activeQuestion.key}-${index}`}>
                      <span>{choice}</span>
                    </li>
                  ))}
                </ul>
                {hint ? (
                  <p className="org-quiz__hint">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                    {hint}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="org-quiz__screen-empty">問題を追加すると、参加画面のイメージが出ます。</p>
            )}
          </div>
        ) : (
          <div className="org-quiz__screen org-quiz__screen--clear">
            <p className="org-quiz__clear-kicker">クリア</p>
            <h3>{title}</h3>
            <p>全問正解、お疲れさまでした。特典の受け取りに進めます。</p>
          </div>
        )}
      </div>
    </aside>
  );
}

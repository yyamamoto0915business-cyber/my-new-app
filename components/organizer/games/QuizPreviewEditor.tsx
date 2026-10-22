"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, ImagePlus, Lightbulb, Plus, Trash2, X } from "lucide-react";
import { QUIZ_CATEGORIES, type QuizFormatId, type QuizQuestion } from "@/lib/organizer/quiz";
import { QuizCheckpointFields, QuizFormatChips } from "@/components/organizer/games/QuizQuestionSettings";
import { cn } from "@/lib/utils";

/** プレビューの中で選べる写真（アプリに入っている写真）。 */
const QUIZ_PHOTOS = [
  "/profile/album/spring/town.jpg",
  "/profile/album/spring/cafe.jpg",
  "/profile/album/spring/river.jpg",
  "/profile/album/spring/sakura.jpg",
  "/profile/album/spring/flower.jpg",
  "/profile/album/spring/nanohana.jpg",
  "/profile/album/spring/sunset.jpg",
  "/profile/album/spring/walk.jpg",
];

const CHOICE_MAX = 6;
const CHOICE_MIN = 2;

export type QuizPreviewEdit = {
  questions: QuizQuestion[];
  /** いま見せている問題（questions の位置）。 */
  index: number;
  onIndex: (index: number) => void;
  onChange: (key: string, patch: Partial<QuizQuestion>) => void;
  onAdd: () => void;
  onDuplicate: (key: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  /** 何問正解でクリアか。 */
  needed: number;
  /** 出題形式で選んだ形式。問題ごとにこの中から選べる。 */
  formats: QuizFormatId[];
};

/**
 * 参加者のクイズ画面（PlayQuiz）と同じ見た目のまま、その場で書き換えられるようにしたもの。
 * 文字はタップで直し、正解は選択肢の丸を押して決める。
 */
export function QuizPreviewEditor({ edit }: { edit: QuizPreviewEdit }) {
  const { questions } = edit;
  /** 写真を選んでいる問題。ほかの問題へ移ると閉じる。 */
  const [pickingKey, setPickingKey] = useState<string | null>(null);
  const index = Math.min(Math.max(edit.index, 0), Math.max(questions.length - 1, 0));
  const question = questions[index] ?? null;

  if (!question) {
    return (
      <div className="play-quiz quiz-edit">
        <button type="button" className="quiz-edit__add-first" onClick={edit.onAdd}>
          <Plus aria-hidden />
          最初の問題を作る
        </button>
      </div>
    );
  }

  const pickingPhoto = pickingKey === question.key;
  const setPickingPhoto = (open: boolean) => setPickingKey(open ? question.key : null);
  const patch = (next: Partial<QuizQuestion>) => edit.onChange(question.key, next);
  const categories = QUIZ_CATEGORIES.includes(question.category as (typeof QUIZ_CATEGORIES)[number])
    ? QUIZ_CATEGORIES
    : [question.category, ...QUIZ_CATEGORIES];

  return (
    <div className="play-quiz quiz-edit">
      <div className="game-test__top">
        <p>0 / {edit.needed} 正解</p>
        <span className="quiz-edit__nav">
          <button
            type="button"
            aria-label="前の問題"
            disabled={index === 0}
            onClick={() => edit.onIndex(index - 1)}
          >
            <ArrowLeft aria-hidden />
          </button>
          {index + 1} / {questions.length}
          <button
            type="button"
            aria-label="次の問題"
            disabled={index >= questions.length - 1}
            onClick={() => edit.onIndex(index + 1)}
          >
            <ArrowRight aria-hidden />
          </button>
        </span>
      </div>

      <div className="quiz-edit__setup">
        <QuizFormatChips
          question={question}
          allowed={edit.formats}
          onChange={(next) => edit.onChange(question.key, next)}
        />
        <QuizCheckpointFields question={question} map={false} onChange={patch} />
        {question.format === "checkin" ? (
          <p className="quiz-edit__setup-note">↓ 着いたあとに出る問題です</p>
        ) : null}
      </div>

      <label className="game-test__chip quiz-edit__chip">
        <select
          value={question.category}
          aria-label="カテゴリ"
          onChange={(event) => patch({ category: event.target.value })}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <div className="quiz-edit__photo">
        {question.imageUrl ? (
          <img
            className={cn("game-test__photo", question.format === "photo" && "game-test__photo--large")}
            src={question.imageUrl}
            alt=""
          />
        ) : (
          <button type="button" className="quiz-edit__photo-empty" onClick={() => setPickingPhoto(true)}>
            <ImagePlus aria-hidden />
            {question.format === "photo" ? "写真を入れる（写真クイズは必須）" : "写真を入れる"}
          </button>
        )}
        {question.imageUrl ? (
          <div className="quiz-edit__photo-tools">
            <button type="button" onClick={() => setPickingPhoto(!pickingPhoto)}>
              <ImagePlus aria-hidden />
              写真を変える
            </button>
            <button type="button" onClick={() => patch({ imageUrl: "" })} aria-label="写真を外す">
              <X aria-hidden />
            </button>
          </div>
        ) : null}
        {pickingPhoto ? (
          <div className="quiz-edit__photos" role="listbox" aria-label="写真を選ぶ">
            {QUIZ_PHOTOS.map((url) => (
              <button
                key={url}
                type="button"
                role="option"
                aria-selected={question.imageUrl === url}
                className={cn(question.imageUrl === url && "is-on")}
                onClick={() => {
                  patch({ imageUrl: url });
                  setPickingPhoto(false);
                }}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <h2>
        <textarea
          className="quiz-edit__text quiz-edit__prompt"
          value={question.prompt}
          placeholder="問題文を入力"
          aria-label="問題文"
          maxLength={200}
          rows={2}
          onChange={(event) => patch({ prompt: event.target.value })}
        />
      </h2>

      <div className={cn("game-test__choices", question.format === "ox" && "game-test__choices--ox")}>
        {question.choices.map((choice, choiceIndex) => {
          const right = question.correctIndex === choiceIndex;
          return (
            <div
              key={`${question.key}-${choiceIndex}`}
              className={cn("game-test__choice quiz-edit__choice", right && "is-right")}
            >
              <button
                type="button"
                className="quiz-edit__mark"
                aria-pressed={right}
                aria-label={right ? "正解" : "これを正解にする"}
                title={right ? "正解" : "これを正解にする"}
                onClick={() => patch({ correctIndex: choiceIndex })}
              >
                {right ? <Check aria-hidden /> : null}
              </button>
              <input
                className="quiz-edit__text"
                value={choice}
                maxLength={40}
                placeholder={`選択肢 ${choiceIndex + 1}`}
                aria-label={`選択肢 ${choiceIndex + 1}`}
                onChange={(event) => {
                  const choices = [...question.choices];
                  choices[choiceIndex] = event.target.value;
                  patch({ choices });
                }}
              />
              {question.choices.length > CHOICE_MIN && question.format !== "ox" ? (
                <button
                  type="button"
                  className="quiz-edit__drop"
                  aria-label={`選択肢 ${choiceIndex + 1} を消す`}
                  onClick={() => {
                    const choices = question.choices.filter((_, itemIndex) => itemIndex !== choiceIndex);
                    const correctIndex =
                      question.correctIndex === choiceIndex
                        ? 0
                        : question.correctIndex > choiceIndex
                          ? question.correctIndex - 1
                          : question.correctIndex;
                    patch({ choices, correctIndex });
                  }}
                >
                  <X aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}
        {question.choices.length < CHOICE_MAX && question.format !== "ox" ? (
          <button
            type="button"
            className="quiz-edit__add-choice"
            onClick={() => patch({ choices: [...question.choices, ""] })}
          >
            <Plus aria-hidden />
            選択肢を足す
          </button>
        ) : null}
      </div>

      <p className="game-test__note quiz-edit__hint">
        <Lightbulb className="h-3.5 w-3.5" aria-hidden />
        <input
          className="quiz-edit__text"
          value={question.hint}
          maxLength={80}
          placeholder="まちがえたときに出すヒント"
          aria-label="ヒント"
          onChange={(event) => patch({ hint: event.target.value })}
        />
      </p>

      <div className="quiz-edit__bar">
        <button
          type="button"
          aria-label="前へ動かす"
          disabled={index === 0}
          onClick={() => {
            edit.onMove(question.key, -1);
            edit.onIndex(index - 1);
          }}
        >
          <ArrowLeft aria-hidden />
        </button>
        <button
          type="button"
          aria-label="後ろへ動かす"
          disabled={index >= questions.length - 1}
          onClick={() => {
            edit.onMove(question.key, 1);
            edit.onIndex(index + 1);
          }}
        >
          <ArrowRight aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => {
            edit.onDuplicate(question.key);
            edit.onIndex(index + 1);
          }}
        >
          <Copy aria-hidden />
          複製
        </button>
        <button
          type="button"
          disabled={questions.length <= 1}
          onClick={() => {
            edit.onRemove(question.key);
            edit.onIndex(Math.max(0, index - 1));
          }}
        >
          <Trash2 aria-hidden />
          削除
        </button>
        <button type="button" className="is-primary" onClick={edit.onAdd}>
          <Plus aria-hidden />
          問題を追加
        </button>
      </div>
    </div>
  );
}

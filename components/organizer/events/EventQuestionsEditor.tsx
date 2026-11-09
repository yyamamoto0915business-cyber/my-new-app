"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  EVENT_QUESTION_LABEL_MAX,
  EVENT_QUESTION_MAX,
  EVENT_QUESTION_OPTION_LEN,
  EVENT_QUESTION_OPTION_MAX,
  EVENT_QUESTION_PRESETS,
  newEventQuestionId,
  type EventQuestion,
} from "@/lib/event-questions";

type Props = {
  value: EventQuestion[];
  onChange: (next: EventQuestion[]) => void;
  inputClassName: string;
};

/** 申し込みのときに聞く質問の編集（自由記述・選択式、5つまで） */
export function EventQuestionsEditor({ value, onChange, inputClassName }: Props) {
  const full = value.length >= EVENT_QUESTION_MAX;
  const update = (id: string, patch: Partial<EventQuestion>) =>
    onChange(value.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= value.length) return;
    const copy = [...value];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  };
  const add = (q: Omit<EventQuestion, "id">) => {
    if (full) return;
    onChange([...value, { ...q, id: newEventQuestionId() }]);
  };
  const usedLabels = new Set(value.map((q) => q.label));

  return (
    <div className="space-y-2.5">
      {value.map((q, index) => (
        <div key={q.id} className="space-y-2 rounded-[10px] border border-[#e8e6e0] bg-[#fbfaf7] p-2.5">
          <div className="flex items-start gap-1.5">
            <span className="mt-2 w-5 shrink-0 text-center text-[11px] font-semibold text-[#888]">Q{index + 1}</span>
            <input
              value={q.label}
              onChange={(e) => update(q.id, { label: e.target.value.slice(0, EVENT_QUESTION_LABEL_MAX) })}
              placeholder="例：アレルギーはありますか？"
              className={`${inputClassName} min-w-0 flex-1`}
              aria-label={`質問${index + 1}`}
            />
            <div className="flex shrink-0 flex-col">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="上へ" className="rounded p-0.5 text-[#888] disabled:opacity-30">
                <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="下へ" className="rounded p-0.5 text-[#888] disabled:opacity-30">
                <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x.id !== q.id))}
              aria-label={`質問${index + 1}を消す`}
              className="mt-1 shrink-0 rounded-full p-1.5 text-[#999] hover:bg-[#f0eee8] hover:text-[#c0392b]"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <div className="flex overflow-hidden rounded-lg border border-[#e0ddd5] text-[12px]">
              {(
                [
                  ["text", "自由に書く"],
                  ["select", "選んでもらう"],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    update(q.id, {
                      type,
                      options: type === "select" ? (q.options?.length ? q.options : ["", ""]) : undefined,
                    })
                  }
                  className={`px-2.5 py-1 font-semibold ${q.type === type ? "bg-[#2B3A6B] text-white" : "bg-white text-[#5c5a54]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-[#5c5a54]">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => update(q.id, { required: e.target.checked })}
                className="h-3.5 w-3.5"
              />
              必須にする
            </label>
          </div>
          {q.type === "select" ? (
            <div className="space-y-1.5 pl-6">
              {(q.options ?? []).map((option, oi) => (
                <div key={oi} className="flex items-center gap-1.5">
                  <input
                    value={option}
                    onChange={(e) => {
                      const options = [...(q.options ?? [])];
                      options[oi] = e.target.value.slice(0, EVENT_QUESTION_OPTION_LEN);
                      update(q.id, { options });
                    }}
                    placeholder={`選択肢${oi + 1}`}
                    className={`${inputClassName} min-w-0 flex-1 !py-1.5 min-[900px]:text-[13px]`}
                  />
                  <button
                    type="button"
                    onClick={() => update(q.id, { options: (q.options ?? []).filter((_, i) => i !== oi) })}
                    disabled={(q.options ?? []).length <= 2}
                    aria-label={`選択肢${oi + 1}を消す`}
                    className="shrink-0 rounded-full p-1 text-[#999] disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ))}
              {(q.options ?? []).length < EVENT_QUESTION_OPTION_MAX ? (
                <button
                  type="button"
                  onClick={() => update(q.id, { options: [...(q.options ?? []), ""] })}
                  className="text-[12px] font-semibold text-[#2B3A6B]"
                >
                  ＋ 選択肢を足す
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}

      {!full ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {EVENT_QUESTION_PRESETS.filter((p) => !usedLabels.has(p.label)).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => add(p)}
                className="min-h-[34px] rounded-full border border-[#e0ddd5] bg-white px-3 py-1.5 text-[12px] text-[#5c5a54] hover:border-[#2B3A6B] min-[900px]:min-h-0 min-[900px]:px-2.5 min-[900px]:py-1 min-[900px]:text-[11.5px]"
              >
                ＋ {p.label.length > 16 ? `${p.label.slice(0, 16)}…` : p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => add({ label: "", type: "text", required: false })}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-[#c9c5bb] px-3 py-1.5 text-[12.5px] font-semibold text-[#2B3A6B]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            質問を足す（あと{EVENT_QUESTION_MAX - value.length}つ）
          </button>
        </div>
      ) : (
        <p className="text-[11.5px] text-[#888]">質問は{EVENT_QUESTION_MAX}つまでです。</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { EventFormData } from "@/lib/events";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { RecurrenceSelector } from "@/components/organizer/events/RecurrenceSelector";
import type { EventRecurrence } from "@/lib/event-recurrence";
import {
  EVENT_FORM_CITIES_BY_PREF,
  EVENT_FORM_PREFECTURES,
  EventFormCard,
  EventFormError,
  eventFormFieldM,
  eventFormFieldSubLbl,
  eventFormPcFieldStack,
  eventFormPcSectionHead,
  eventFormPcSectionSub,
  eventFormPcSectionTitle,
  eventFormStackedFields,
  eventFormDateTimeRow,
  eventFormDateTimeStack,
  EventFormHint,
  EventFormLabel,
  EventFormTagSelector,
  eventFormInp,
  eventFormInpErr,
  eventFormInpSm,
  type EventFormStep,
} from "@/components/organizer/events/event-form-ui";

type FormErrors = Partial<Record<keyof EventFormData, string>>;

export type EventFormStepContentProps = {
  currentStep: EventFormStep;
  mode: "create" | "edit";
  form: EventFormData;
  errors: FormErrors;
  itemsInput: string;
  setItemsInput: (value: string) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleItemsBlur: () => void;
  setForm: React.Dispatch<React.SetStateAction<EventFormData>>;
  todayJst: string;
  startTimeMin?: string;
  eventId?: string;
};

const docIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const calendarIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const infoIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function ParticipationSettings({
  form,
  setForm,
}: {
  form: EventFormData;
  setForm: React.Dispatch<React.SetStateAction<EventFormData>>;
}) {
  const hasRequired =
    form.participationMode === "required" || form.participationMode === "optional";

  return (
    <div className="space-y-4">
      <div>
        <EventFormLabel label="参加登録" opt="設定" />
        <EventFormHint text="参加申込が必要なイベントのときだけ「参加登録あり」を選んでください" />
        <div className="mt-3 space-y-2">
          {[
            {
              mode: "required" as const,
              label: "参加登録あり",
              desc: "申込必須。参加者は「申し込む」から応募します",
            },
            {
              mode: "optional" as const,
              label: "参加登録任意",
              desc: "「参加予定にする」で関心を表明。申込も可能",
            },
            {
              mode: "none" as const,
              label: "参加登録なし",
              desc: "自由参加。参加予定・気になるボタンのみ",
            },
          ].map(({ mode, label, desc }) => (
            <label
              key={mode}
              className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#e8e6e0] bg-white p-3 transition has-[:checked]:border-[#2B3A6B] has-[:checked]:bg-[#EEF2FF]"
            >
              <input
                type="radio"
                name="participationMode"
                checked={(form.participationMode ?? "none") === mode}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    participationMode: mode,
                    requiresRegistration: mode === "required",
                  }))
                }
                className="mt-0.5"
                style={{ accentColor: "#2B3A6B" }}
              />
              <div>
                <span className="text-[13px] font-medium text-[#1a1a1a]">{label}</span>
                <p className="mt-0.5 text-[11px] text-[#888]">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {(form.participationMode ?? "none") === "required" && (
        <div className="space-y-3.5 border-t border-[#e8e6e0] pt-4">
          <div>
            <EventFormLabel label="定員" opt="任意" />
            <input
              name="capacity"
              type="number"
              min={0}
              value={form.capacity ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  capacity: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              placeholder="例：50"
              className={eventFormInp}
            />
          </div>
          <div>
            <EventFormLabel label="申込締切" opt="任意" />
            <input
              type="datetime-local"
              value={
                form.registrationDeadline
                  ? (() => {
                      const d = new Date(form.registrationDeadline);
                      const pad = (n: number) => String(n).padStart(2, "0");
                      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    })()
                  : ""
              }
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  registrationDeadline: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                }))
              }
              className={eventFormInp}
            />
          </div>
          <div>
            <EventFormLabel label="申込メモ・注意事項" opt="任意" />
            <textarea
              name="registrationNote"
              rows={3}
              value={form.registrationNote ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  registrationNote: e.target.value || undefined,
                }))
              }
              placeholder="参加者への連絡事項や注意書き"
              className={`${eventFormInp} resize-none`}
            />
          </div>
        </div>
      )}

      <div>
        <EventFormLabel label="参加費（円）" required />
        <input
          name="price"
          type="number"
          min={0}
          value={form.price}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              price: parseInt(e.target.value, 10) || 0,
            }))
          }
          className={eventFormInp}
        />
        <EventFormHint text="0で無料イベント" />
      </div>

      <div>
        <EventFormLabel label="料金補足" opt="任意" />
        <input
          name="priceNote"
          value={form.priceNote || ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, priceNote: e.target.value }))
          }
          placeholder="例：材料費込み"
          className={eventFormInp}
        />
      </div>

      {hasRequired && (
        <div>
          <EventFormLabel label="優先枠数" opt="任意" />
          <input
            name="prioritySlots"
            type="number"
            min={0}
            value={form.prioritySlots ?? 0}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                prioritySlots: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className={eventFormInp}
          />
        </div>
      )}
    </div>
  );
}

function PostPublishFeatures({ eventId }: { eventId?: string }) {
  const staffHref = eventId
    ? `/organizer/events/${eventId}/sponsors`
    : "/organizer/events";

  return (
    <div className="flex flex-col gap-[12px]">
      {[
        {
          bg: "#EEF4FB",
          stroke: "#2B3A6B",
          title: "スタッフを募集する",
          desc: "受付・誘導・設営など役割ごとに募集できます。公開後にスタッフ募集ページから設定できます。",
          btn: "スタッフ募集ページへ →",
          href: staffHref,
        },
        {
          bg: "#FFF8EC",
          stroke: "#c8a84b",
          title: "協賛を受け付ける",
          desc: "売上受取設定（Stripe）完了後に利用できます。協賛金の受け取りが可能になります。",
          btn: eventId ? "協賛設定へ →" : "公開後に設定できます",
          href: eventId ? `/organizer/events/${eventId}/sponsors` : "#",
        },
        {
          bg: "#EAF6DE",
          stroke: "#3a7a10",
          title: "参加者へのメッセージ",
          desc: "公開後、参加申込者と受信箱でメッセージのやりとりができます。",
          btn: null,
          href: null,
        },
      ].map(({ bg, stroke, title, desc, btn, href }) => (
        <div
          key={title}
          className="flex items-start gap-[12px] rounded-[12px] border border-[#e8e6e0] bg-white p-[16px]"
        >
          <div
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: bg }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={stroke}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div>
            <div className="mb-1 text-[13px] font-[500]">{title}</div>
            <p className="mb-2 text-[12px] leading-[1.6] text-[#888]">{desc}</p>
            {btn && href && href !== "#" && (
              <Link
                href={href}
                className="rounded-[8px] border border-[#e8e6e0] bg-white px-[14px] py-[6px] text-[12px] text-[#2B3A6B] hover:bg-[#f5f4f0]"
              >
                {btn}
              </Link>
            )}
            {btn && href === "#" && (
              <span className="text-[12px] text-[#888]">{btn}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventFormStepContent({
  currentStep,
  mode,
  form,
  errors,
  itemsInput,
  setItemsInput,
  handleChange,
  handleItemsBlur,
  setForm,
  todayJst,
  startTimeMin,
  eventId,
}: EventFormStepContentProps) {
  if (currentStep === 1) {
    return (
      <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
        <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-6">
          <div className={eventFormPcSectionHead}>
            <h3 className={`${eventFormPcSectionTitle} flex items-center gap-2`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B3A6B" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              基本情報
            </h3>
            <p className={eventFormPcSectionSub}>
              イベント名・概要・主催者情報を入力してください
            </p>
          </div>

          <div className="min-[900px]:hidden">
            <EventFormCard title="基本情報" icon={docIcon}>
              <div className={eventFormFieldM}>
                <EventFormLabel label="イベント名" required />
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="例：春の地域マルシェ"
                  className={`${eventFormInpSm} ${errors.title ? eventFormInpErr : ""}`}
                />
                <EventFormError msg={errors.title} />
              </div>
              <div className={eventFormFieldM}>
                <EventFormLabel label="イベント概要" required />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="イベントの内容や魅力を簡潔に紹介してください"
                  className={`${eventFormInpSm} resize-y min-h-[4.5rem] max-h-28 ${errors.description ? eventFormInpErr : ""}`}
                />
                <EventFormError msg={errors.description} />
              </div>
              <div className="mb-[11px] grid grid-cols-2 gap-[9px]">
                <div>
                  <EventFormLabel label="主催者名" required />
                  <input
                    name="organizerName"
                    value={form.organizerName ?? ""}
                    onChange={handleChange}
                    placeholder="例：地域振興会"
                    className={`${eventFormInpSm} ${errors.organizerName ? eventFormInpErr : ""}`}
                  />
                  <EventFormError msg={errors.organizerName} />
                </div>
                <div>
                  <EventFormLabel label="連絡先" opt="任意" />
                  <input
                    name="organizerContact"
                    value={form.organizerContact ?? ""}
                    onChange={handleChange}
                    placeholder="メール・電話"
                    className={eventFormInpSm}
                  />
                </div>
              </div>
              <div className={eventFormFieldM}>
                <EventFormLabel label="アイキャッチ画像" opt="任意" />
                <EventImageInput
                  url={form.imageUrl ?? ""}
                  onChangeUrl={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                  alt={form.title || "プレビュー"}
                />
              </div>
              <div>
                <EventFormLabel label="カテゴリー・タグ" opt="任意" />
                <EventFormTagSelector
                  selected={form.tags ?? []}
                  onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
                />
              </div>
            </EventFormCard>
          </div>

          <div className={eventFormPcFieldStack}>
            <div>
              <EventFormLabel label="イベント名" required />
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例：春の地域マルシェ"
                className={`${eventFormInp} ${errors.title ? eventFormInpErr : ""}`}
              />
              <EventFormError msg={errors.title} />
            </div>
            <div>
              <EventFormLabel label="イベント概要" required />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="イベントの内容や魅力を紹介してください"
                className={`${eventFormInp} resize-none ${errors.description ? eventFormInpErr : ""}`}
              />
              <EventFormError msg={errors.description} />
            </div>
            <div className="space-y-3.5 border-t border-[#e8e6e0] pt-4">
              <div>
                <EventFormLabel label="主催者名" required />
                <input
                  name="organizerName"
                  value={form.organizerName ?? ""}
                  onChange={handleChange}
                  placeholder="例：地域振興会 / 〇〇実行委員会"
                  className={`${eventFormInp} ${errors.organizerName ? eventFormInpErr : ""}`}
                />
                <EventFormError msg={errors.organizerName} />
              </div>
              <div>
                <EventFormLabel label="連絡先" opt="任意" />
                <input
                  name="organizerContact"
                  value={form.organizerContact ?? ""}
                  onChange={handleChange}
                  placeholder="例：03-1234-5678 / mail@example.com"
                  className={eventFormInp}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6">
          <div className={eventFormPcSectionHead}>
            <h3 className={eventFormPcSectionTitle}>画像・タグ</h3>
            <p className={eventFormPcSectionSub}>アイキャッチとカテゴリーを設定します</p>
          </div>
          <div className={eventFormPcFieldStack}>
            <div>
              <EventFormLabel label="アイキャッチ画像" opt="任意" />
              <EventImageInput
                compact
                url={form.imageUrl ?? ""}
                onChangeUrl={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
                alt={form.title || "プレビュー"}
              />
            </div>
            <div>
              <EventFormLabel label="カテゴリー・特徴タグ" opt="複数選択可" />
              <EventFormTagSelector
                selected={form.tags ?? []}
                onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
              />
            </div>
            {mode === "edit" && (
              <div className="flex flex-wrap gap-4 border-t border-[#e8e6e0] pt-4">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1a1a1a]">
                  <input
                    type="checkbox"
                    checked={form.childFriendly ?? false}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, childFriendly: e.target.checked }))
                    }
                    style={{ accentColor: "#2B3A6B" }}
                  />
                  子連れOK
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#1a1a1a]">
                  <input
                    type="checkbox"
                    checked={form.englishGuideAvailable ?? false}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        englishGuideAvailable: e.target.checked,
                      }))
                    }
                    style={{ accentColor: "#2B3A6B" }}
                  />
                  英語対応あり
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
        <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-6">
          <div className={eventFormPcSectionHead}>
            <div className="mb-0.5 flex items-center gap-2 text-[15px] font-[600]">
              {calendarIcon}
              開催日時・場所
            </div>
            <p className="text-[12px] text-[#888]">開催日時と会場名を入力してください</p>
          </div>

          <div className="min-[900px]:hidden">
            <EventFormCard title="開催情報" icon={calendarIcon}>
              <div className={eventFormFieldM}>
                <EventFormLabel label="開催日時" required />
                <div className={eventFormDateTimeStack}>
                  <div>
                    <div className={eventFormFieldSubLbl}>開催日</div>
                    <input
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      min={todayJst}
                      className={`${eventFormInpSm} ${errors.date ? eventFormInpErr : ""}`}
                    />
                  </div>
                  <div className={eventFormDateTimeRow}>
                    <div>
                      <div className={eventFormFieldSubLbl}>開始時刻</div>
                      <input
                        name="startTime"
                        type="time"
                        value={form.startTime}
                        onChange={handleChange}
                        min={startTimeMin}
                        className={`${eventFormInpSm} ${errors.startTime ? eventFormInpErr : ""}`}
                      />
                    </div>
                    <div>
                      <div className={eventFormFieldSubLbl}>終了（任意）</div>
                      <input
                        name="endTime"
                        type="time"
                        value={form.endTime || ""}
                        onChange={handleChange}
                        className={`${eventFormInpSm} ${errors.endTime ? eventFormInpErr : ""}`}
                      />
                    </div>
                  </div>
                </div>
                <EventFormError msg={errors.date || errors.startTime || errors.endTime} />
              </div>
              <div className={eventFormFieldM}>
                <EventFormLabel label="開催パターン" />
                <RecurrenceSelector
                  value={form.recurrence ?? "none"}
                  count={form.recurrenceCount}
                  onChange={(recurrence: EventRecurrence) =>
                    setForm((prev) => ({
                      ...prev,
                      recurrence,
                      recurrenceCount: recurrence === "none" ? null : prev.recurrenceCount,
                    }))
                  }
                  onCountChange={(recurrenceCount) =>
                    setForm((prev) => ({ ...prev, recurrenceCount }))
                  }
                />
                <EventFormError msg={errors.recurrenceCount} />
              </div>
              <div className={eventFormFieldM}>
                <EventFormLabel label="開催場所" required />
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="例：市民ホール / オンライン開催"
                  className={`${eventFormInpSm} ${errors.location ? eventFormInpErr : ""}`}
                />
                <EventFormHint text="会場名や施設名を入力" />
                <EventFormError msg={errors.location} />
              </div>
              <div className={`${eventFormStackedFields} mb-[11px]`}>
                <div>
                  <EventFormLabel label="都道府県" required />
                  <select
                    name="prefecture"
                    value={form.prefecture ?? ""}
                    onChange={handleChange}
                    className={eventFormInpSm}
                  >
                    <option value="">選択してください</option>
                    {EVENT_FORM_PREFECTURES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <EventFormLabel label="住所" required />
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="例：渋谷区〇〇町1-2-3"
                    className={`${eventFormInpSm} ${errors.address ? eventFormInpErr : ""}`}
                  />
                  <EventFormError msg={errors.address} />
                </div>
                <div>
                  <EventFormLabel label="アクセス" opt="任意" />
                  <input
                    name="access"
                    value={form.access || ""}
                    onChange={handleChange}
                    placeholder="例：渋谷駅徒歩10分"
                    className={eventFormInpSm}
                  />
                </div>
                {mode === "create" && (
                  <>
                    <div>
                      <EventFormLabel label="参加費（円）" />
                      <input
                        name="price"
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={handleChange}
                        className={eventFormInpSm}
                      />
                      <EventFormHint text="0で無料イベント" />
                    </div>
                    <div>
                      <EventFormLabel label="雨天時対応" opt="任意" />
                      <input
                        name="rainPolicy"
                        value={form.rainPolicy || ""}
                        onChange={handleChange}
                        placeholder="例：雨天決行"
                        className={eventFormInpSm}
                      />
                    </div>
                  </>
                )}
              </div>
            </EventFormCard>
          </div>

          <div className={eventFormPcFieldStack}>
            <div>
              <EventFormLabel label="開催日時" required />
              <div className={eventFormDateTimeStack}>
                <div>
                  <div className={eventFormFieldSubLbl}>開催日</div>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    min={todayJst}
                    className={`${eventFormInp} ${errors.date ? eventFormInpErr : ""}`}
                  />
                </div>
                <div className={eventFormDateTimeRow}>
                  <div>
                    <div className={eventFormFieldSubLbl}>開始時刻</div>
                    <input
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      min={startTimeMin}
                      className={`${eventFormInp} ${errors.startTime ? eventFormInpErr : ""}`}
                    />
                  </div>
                  <div>
                    <div className={eventFormFieldSubLbl}>終了（任意）</div>
                    <input
                      name="endTime"
                      type="time"
                      value={form.endTime || ""}
                      onChange={handleChange}
                      className={`${eventFormInp} ${errors.endTime ? eventFormInpErr : ""}`}
                    />
                  </div>
                </div>
              </div>
              <EventFormHint text="終了時刻は未入力でも保存できます" />
              <EventFormError msg={errors.date || errors.startTime || errors.endTime} />
            </div>
            <div>
              <EventFormLabel label="開催パターン" />
              <RecurrenceSelector
                compact
                value={form.recurrence ?? "none"}
                count={form.recurrenceCount}
                onChange={(recurrence: EventRecurrence) =>
                  setForm((prev) => ({
                    ...prev,
                    recurrence,
                    recurrenceCount: recurrence === "none" ? null : prev.recurrenceCount,
                  }))
                }
                onCountChange={(recurrenceCount) =>
                  setForm((prev) => ({ ...prev, recurrenceCount }))
                }
              />
              <EventFormError msg={errors.recurrenceCount} />
            </div>
            <div>
              <EventFormLabel label="開催場所" required />
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="例：市民ホール / オンライン開催"
                className={`${eventFormInp} ${errors.location ? eventFormInpErr : ""}`}
              />
              <EventFormHint text="会場名や施設名を入力してください" />
              <EventFormError msg={errors.location} />
            </div>
          </div>
        </div>

        <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6">
          <div className={eventFormPcSectionHead}>
            <h3 className={eventFormPcSectionTitle}>住所・参加費</h3>
            <p className={eventFormPcSectionSub}>住所・アクセスと参加費を設定します</p>
          </div>
          <div className={eventFormPcFieldStack}>
            <div>
              <EventFormLabel label="都道府県" required />
              <select
                name="prefecture"
                value={form.prefecture ?? ""}
                onChange={handleChange}
                className={eventFormInp}
              >
                <option value="">選択してください</option>
                {EVENT_FORM_PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <EventFormLabel label="住所" required />
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="例：渋谷区〇〇町1-2-3"
                className={`${eventFormInp} ${errors.address ? eventFormInpErr : ""}`}
              />
              <EventFormError msg={errors.address} />
            </div>
            {form.prefecture &&
              (EVENT_FORM_CITIES_BY_PREF[form.prefecture] ?? []).length > 0 && (
                <div>
                  <EventFormLabel label="市区町村" opt="任意" />
                  <select
                    name="city"
                    value={form.city ?? ""}
                    onChange={handleChange}
                    className={eventFormInp}
                  >
                    <option value="">選択してください</option>
                    {EVENT_FORM_CITIES_BY_PREF[form.prefecture]?.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            <div>
              <EventFormLabel label="アクセス" opt="任意" />
              <input
                name="access"
                value={form.access || ""}
                onChange={handleChange}
                placeholder="例：渋谷駅徒歩10分"
                className={eventFormInp}
              />
              <EventFormHint text="目印や最寄り駅・バス停など" />
            </div>
            {mode === "create" && (
              <div className="space-y-3.5 border-t border-[#e8e6e0] pt-4">
                <div>
                  <EventFormLabel label="参加費（円）" />
                  <input
                    name="price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={handleChange}
                    className={`${eventFormInp} ${errors.price ? eventFormInpErr : ""}`}
                  />
                  <EventFormHint text="0で無料。有料の場合はStripe設定が必要です" />
                  <EventFormError msg={errors.price} />
                </div>
                <div>
                  <EventFormLabel label="雨天時対応" opt="任意" />
                  <input
                    name="rainPolicy"
                    value={form.rainPolicy || ""}
                    onChange={handleChange}
                    placeholder="例：雨天決行 / 小雨決行・荒天中止"
                    className={eventFormInp}
                  />
                  <EventFormHint text="開催方針を短く記載してください" />
                </div>
              </div>
            )}
            {mode === "edit" && (
              <div>
                <EventFormLabel label="雨天時対応" opt="任意" />
                <input
                  name="rainPolicy"
                  value={form.rainPolicy || ""}
                  onChange={handleChange}
                  placeholder="例：雨天決行 / 小雨決行・荒天中止"
                  className={eventFormInp}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
        <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-6">
          <div className={eventFormPcSectionHead}>
            <div className="mb-0.5 flex items-center gap-2 text-[15px] font-[600]">
              {infoIcon}
              詳細情報（任意）
            </div>
            <p className="text-[12px] text-[#888]">
              必要なときだけ入力してください。あとから編集できます
            </p>
          </div>

          <div className="min-[900px]:hidden">
            <EventFormCard title="詳細情報（任意）" icon={infoIcon}>
              {mode === "edit" && (
                <div className="mb-[11px]">
                  <ParticipationSettings form={form} setForm={setForm} />
                </div>
              )}
              <div className="mb-[11px] grid grid-cols-2 gap-[9px]">
                <div>
                  <EventFormLabel label="定員" opt="任意" />
                  <input
                    name="capacity"
                    type="number"
                    min={0}
                    value={form.capacity ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        capacity: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="未入力で無制限"
                    className={eventFormInpSm}
                  />
                </div>
              </div>
              <div className={eventFormFieldM}>
                <EventFormLabel label="持ち物・服装" opt="任意" />
                <input
                  value={itemsInput}
                  onChange={(e) => setItemsInput(e.target.value)}
                  onBlur={handleItemsBlur}
                  placeholder="例：動きやすい服装、飲み物"
                  className={eventFormInpSm}
                />
              </div>
              <div>
                <EventFormLabel label="備考・注意事項" opt="任意" />
                <textarea
                  name="registrationNote"
                  value={form.registrationNote ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      registrationNote: e.target.value || undefined,
                    }))
                  }
                  rows={2}
                  placeholder="参加者への特記事項があれば入力してください"
                  className={`${eventFormInpSm} resize-y min-h-[4rem] max-h-24`}
                />
              </div>
            </EventFormCard>
          </div>

          <div className={eventFormPcFieldStack}>
            {mode === "create" && (
              <>
                <div>
                  <EventFormLabel label="定員" opt="任意" />
                  <input
                    name="capacity"
                    type="number"
                    min={0}
                    value={form.capacity ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        capacity: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="例：30"
                    className={eventFormInp}
                  />
                  <EventFormHint text="未入力で無制限。設定すると定員に達した時点で申し込みが締め切られます" />
                </div>
                <div>
                  <EventFormLabel label="申し込み締め切り" opt="任意" />
                  <input
                    type="date"
                    value={
                      form.registrationDeadline
                        ? new Date(form.registrationDeadline).toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        registrationDeadline: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : undefined,
                      }))
                    }
                    className={eventFormInp}
                  />
                  <EventFormHint text="未入力の場合は開催日まで受け付けます" />
                </div>
              </>
            )}
            <div>
              <EventFormLabel label="持ち物・服装" opt="任意" />
              <input
                value={itemsInput}
                onChange={(e) => setItemsInput(e.target.value)}
                onBlur={handleItemsBlur}
                placeholder="例：動きやすい服装、飲み物、筆記用具"
                className={eventFormInp}
              />
              <EventFormHint text="カンマまたは改行で区切って入力" />
            </div>
            <div>
              <EventFormLabel label="備考・注意事項" opt="任意" />
              <textarea
                name="registrationNote"
                value={form.registrationNote ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    registrationNote: e.target.value || undefined,
                  }))
                }
                rows={4}
                placeholder="参加者への特記事項があれば入力してください。キャンセルポリシーや注意事項など。"
                className={`${eventFormInp} resize-none`}
              />
            </div>
          </div>
        </div>

        <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-6">
          {mode === "create" ? (
            <>
              <div className="mb-3 border-b border-[#e8e6e0] pb-2">
                <div className="mb-0.5 text-[15px] font-[600] text-[#888]">
                  公開後に設定できること
                </div>
                <p className="text-[11px] text-[#888]">
                  イベント公開後にこれらの機能を追加できます
                </p>
              </div>
              <PostPublishFeatures eventId={eventId} />
            </>
          ) : (
            <>
              <div className={eventFormPcSectionHead}>
                <h3 className={eventFormPcSectionTitle}>参加設定</h3>
                <p className={eventFormPcSectionSub}>
                  参加登録の要否や料金を設定します
                </p>
              </div>
              <ParticipationSettings form={form} setForm={setForm} />
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}

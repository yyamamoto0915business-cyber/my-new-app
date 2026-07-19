"use client";

import type { EventFormData } from "@/lib/events";
import { EventImageInput } from "@/components/organizer/events/EventImageInput";
import { RecurrenceSelector } from "@/components/organizer/events/RecurrenceSelector";
import { PostPublishFeatures } from "@/components/organizer/events/PostPublishFeatures";
import { EventFormatSelector } from "@/components/organizer/events/EventFormatSelector";
import { OnlineParticipationSettingsCard } from "@/components/organizer/events/OnlineParticipationSettingsCard";
import type { EventRecurrence } from "@/lib/event-recurrence";
import {
  DEFAULT_ONLINE_LINK_DISPLAY_TIMING,
  isOnlineCapableFormat,
  needsVenueFields,
  normalizeEventFormat,
  type EventFormat,
} from "@/lib/event-online";
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
  onOpenPassSettings?: () => void;
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

export function EventFormStepContent({
  currentStep,
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
  onOpenPassSettings,
}: EventFormStepContentProps) {
  if (currentStep === 1) {
    return (
      <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
        <div className="min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:p-4">
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
                  childFriendly={form.childFriendly}
                  onChildFriendlyChange={(value) =>
                    setForm((prev) => ({ ...prev, childFriendly: value }))
                  }
                  englishGuideAvailable={form.englishGuideAvailable}
                  onEnglishGuideAvailableChange={(value) =>
                    setForm((prev) => ({ ...prev, englishGuideAvailable: value }))
                  }
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
                rows={3}
                placeholder="イベントの内容や魅力を紹介してください"
                className={`${eventFormInp} min-h-0 resize-y max-h-36 ${errors.description ? eventFormInpErr : ""}`}
              />
              <EventFormError msg={errors.description} />
            </div>
            <div className="space-y-2.5 border-t border-[#e8e6e0] pt-3">
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

        <div className="hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:p-4">
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
                childFriendly={form.childFriendly}
                onChildFriendlyChange={(value) =>
                  setForm((prev) => ({ ...prev, childFriendly: value }))
                }
                englishGuideAvailable={form.englishGuideAvailable}
                onEnglishGuideAvailableChange={(value) =>
                  setForm((prev) => ({ ...prev, englishGuideAvailable: value }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2) {
    const format: EventFormat = normalizeEventFormat(form.eventFormat);
    const showVenue = needsVenueFields(format);
    const showOnline = isOnlineCapableFormat(format);
    const isHybrid = showOnline && showVenue;

    const handleFormatChange = (next: EventFormat) => {
      setForm((prev) => ({ ...prev, eventFormat: next }));
    };

    const patchOnline = (patch: {
      onlineService?: EventFormData["onlineService"];
      onlineJoinUrl?: string;
      onlineMeetingId?: string;
      onlinePasscode?: string;
      onlineGuideMessage?: string;
    }) => {
      setForm((prev) => ({ ...prev, ...patch }));
    };

    const handleTimingChange = (
      timing: NonNullable<EventFormData["onlineLinkDisplayTiming"]>
    ) => {
      setForm((prev) => ({ ...prev, onlineLinkDisplayTiming: timing }));
    };

    const sectionSub = showOnline && showVenue
      ? "開催日時・会場・配信情報を入力してください"
      : showOnline
        ? "開催日時と配信情報を入力してください"
        : "開催日時と会場名を入力してください";

    const rightSectionTitle = showOnline && showVenue
      ? "会場・配信・参加費"
      : showOnline
        ? "配信情報・参加費"
        : "住所・参加費";
    const rightSectionSub = showOnline && showVenue
      ? "会場情報・配信情報・参加費を設定します"
      : showOnline
        ? "オンライン配信情報と参加費を設定します"
        : "住所・アクセスと参加費を設定します";

    const dateTimeFields = (inp: string, err: string) => (
      <>
        <div className={isHybrid ? "min-w-0 space-y-1.5" : eventFormDateTimeStack}>
          <div>
            <div className={isHybrid ? "mb-1 text-[11px] text-[#888]" : eventFormFieldSubLbl}>開催日</div>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              min={todayJst}
              className={`${inp} ${errors.date ? err : ""}`}
            />
          </div>
          <div className={isHybrid ? "grid min-w-0 grid-cols-2 gap-1.5 [&>*]:min-w-0" : eventFormDateTimeRow}>
            <div>
              <div className={isHybrid ? "mb-1 text-[11px] text-[#888]" : eventFormFieldSubLbl}>開始時刻</div>
              <input
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
                min={startTimeMin}
                className={`${inp} ${errors.startTime ? err : ""}`}
              />
            </div>
            <div>
              <div className={isHybrid ? "mb-1 text-[11px] text-[#888]" : eventFormFieldSubLbl}>終了（任意）</div>
              <input
                name="endTime"
                type="time"
                value={form.endTime || ""}
                onChange={handleChange}
                className={`${inp} ${errors.endTime ? err : ""}`}
              />
            </div>
          </div>
        </div>
        <EventFormError msg={errors.date || errors.startTime || errors.endTime} />
      </>
    );

    const pcInp = isHybrid ? eventFormInpSm : eventFormInp;
    const pcPad = isHybrid ? "min-[900px]:p-3" : "min-[900px]:p-4";
    const pcStack = isHybrid
      ? "hidden min-[900px]:block space-y-1.5"
      : eventFormPcFieldStack;

    return (
      <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
        <div
          className={`min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 ${pcPad}`}
        >
          <div
            className={
              isHybrid
                ? "hidden min-[900px]:block mb-2 border-b border-[#e8e6e0] pb-1.5"
                : eventFormPcSectionHead
            }
          >
            <div className="mb-0.5 flex items-center gap-2 text-[15px] font-[600]">
              {calendarIcon}
              開催情報
            </div>
            <p className="text-[12px] text-[#888]">{sectionSub}</p>
          </div>

          <div className="min-[900px]:hidden">
            <EventFormCard title="開催情報" icon={calendarIcon}>
              <div className={eventFormFieldM}>
                <EventFormatSelector value={format} onChange={handleFormatChange} />
              </div>
              <div className={eventFormFieldM}>
                <EventFormLabel label="開催日時" required />
                {dateTimeFields(eventFormInpSm, eventFormInpErr)}
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

              {showVenue && (
                <>
                  <div className={eventFormFieldM}>
                    <EventFormLabel label="開催場所" required />
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="例：市民ホール"
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
                  </div>
                </>
              )}

              {showOnline && (
                <div className="mb-[11px]">
                  <OnlineParticipationSettingsCard
                    onlineService={form.onlineService}
                    onlineJoinUrl={form.onlineJoinUrl ?? ""}
                    onlineMeetingId={form.onlineMeetingId ?? ""}
                    onlinePasscode={form.onlinePasscode ?? ""}
                    onlineGuideMessage={form.onlineGuideMessage ?? ""}
                    timing={form.onlineLinkDisplayTiming ?? DEFAULT_ONLINE_LINK_DISPLAY_TIMING}
                    errors={errors}
                    compact
                    dense={isHybrid}
                    onChange={patchOnline}
                    onTimingChange={handleTimingChange}
                  />
                </div>
              )}

              <div className={eventFormFieldM}>
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
            </EventFormCard>
          </div>

          <div className={pcStack}>
            <div className={`border-b border-[#e8e6e0] ${isHybrid ? "pb-1.5" : "pb-2"}`}>
              <EventFormatSelector value={format} onChange={handleFormatChange} />
            </div>
            <div>
              <EventFormLabel label="開催日時" required />
              {dateTimeFields(pcInp, eventFormInpErr)}
              {!isHybrid && (
                <EventFormHint text="終了時刻は未入力でも保存できます" />
              )}
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
            {showVenue && (
              <div>
                <EventFormLabel label="開催場所" required />
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="例：市民ホール"
                  className={`${pcInp} ${errors.location ? eventFormInpErr : ""}`}
                />
                {!isHybrid && (
                  <EventFormHint text="会場名や施設名を入力してください" />
                )}
                <EventFormError msg={errors.location} />
              </div>
            )}
            {/* オンラインのみ: 左に参加費を置き、右カラムの高さとバランス */}
            {showOnline && !showVenue ? (
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
            ) : null}
          </div>
        </div>

        <div
          className={`hidden min-[900px]:block min-[900px]:flex-1 min-[900px]:min-h-0 min-[900px]:overflow-y-auto ${pcPad}`}
        >
          <div
            className={
              isHybrid
                ? "hidden min-[900px]:block mb-2 border-b border-[#e8e6e0] pb-1.5"
                : eventFormPcSectionHead
            }
          >
            <h3 className={eventFormPcSectionTitle}>{rightSectionTitle}</h3>
            <p className={eventFormPcSectionSub}>{rightSectionSub}</p>
          </div>
          <div className={pcStack}>
            {showVenue && (
              <>
                <div
                  className={
                    form.prefecture &&
                    (EVENT_FORM_CITIES_BY_PREF[form.prefecture] ?? []).length > 0
                      ? "grid grid-cols-2 gap-1.5"
                      : undefined
                  }
                >
                  <div>
                    <EventFormLabel label="都道府県" required />
                    <select
                      name="prefecture"
                      value={form.prefecture ?? ""}
                      onChange={handleChange}
                      className={pcInp}
                    >
                      <option value="">選択してください</option>
                      {EVENT_FORM_PREFECTURES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.prefecture &&
                    (EVENT_FORM_CITIES_BY_PREF[form.prefecture] ?? []).length > 0 && (
                      <div>
                        <EventFormLabel label="市区町村" opt="任意" />
                        <select
                          name="city"
                          value={form.city ?? ""}
                          onChange={handleChange}
                          className={pcInp}
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
                </div>
                <div className={isHybrid ? "grid grid-cols-2 gap-1.5" : undefined}>
                  <div>
                    <EventFormLabel label="住所" required />
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="例：渋谷区〇〇町1-2-3"
                      className={`${pcInp} ${errors.address ? eventFormInpErr : ""}`}
                    />
                    <EventFormError msg={errors.address} />
                  </div>
                  {isHybrid ? (
                    <div>
                      <EventFormLabel label="アクセス" opt="任意" />
                      <input
                        name="access"
                        value={form.access || ""}
                        onChange={handleChange}
                        placeholder="例：渋谷駅徒歩10分"
                        className={pcInp}
                      />
                    </div>
                  ) : null}
                </div>
                {!isHybrid && (
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
                )}
              </>
            )}

            {showOnline && (
              <OnlineParticipationSettingsCard
                onlineService={form.onlineService}
                onlineJoinUrl={form.onlineJoinUrl ?? ""}
                onlineMeetingId={form.onlineMeetingId ?? ""}
                onlinePasscode={form.onlinePasscode ?? ""}
                onlineGuideMessage={form.onlineGuideMessage ?? ""}
                timing={form.onlineLinkDisplayTiming ?? DEFAULT_ONLINE_LINK_DISPLAY_TIMING}
                errors={errors}
                compact
                dense={isHybrid}
                onChange={patchOnline}
                onTimingChange={handleTimingChange}
              />
            )}

            {/* 現地・ハイブリッド: 参加費は右。オンラインのみは左へ移動済み */}
            {showVenue || !showOnline ? (
              <div
                className={
                  isHybrid
                    ? "grid grid-cols-2 gap-1.5 border-t border-[#e8e6e0] pt-1.5"
                    : "space-y-2.5 border-t border-[#e8e6e0] pt-3"
                }
              >
                <div>
                  <EventFormLabel label="参加費（円）" />
                  <input
                    name="price"
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={handleChange}
                    className={`${pcInp} ${errors.price ? eventFormInpErr : ""}`}
                  />
                  {!isHybrid && (
                    <EventFormHint text="0で無料。有料の場合はStripe設定が必要です" />
                  )}
                  <EventFormError msg={errors.price} />
                </div>
                {showVenue && (
                  <div>
                    <EventFormLabel label="雨天時対応" opt="任意" />
                    <input
                      name="rainPolicy"
                      value={form.rainPolicy || ""}
                      onChange={handleChange}
                      placeholder="例：雨天決行 / 小雨決行・荒天中止"
                      className={pcInp}
                    />
                    {!isHybrid && (
                      <EventFormHint text="開催方針を短く記載してください" />
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3) {
    const noteLen = (form.registrationNote ?? "").length;
    const postPublishForm = {
      price: form.price,
      capacity: form.capacity,
      registrationDeadline: form.registrationDeadline,
      participationMode: form.participationMode,
      paymentMethod: form.paymentMethod,
      checkInMethod: form.checkInMethod,
      passConfigured: form.passConfigured,
    };

    return (
      <div className="flex flex-col min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-row min-[900px]:overflow-hidden">
        <div className="min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-[#e8e6e0] p-4 min-[900px]:px-5 min-[900px]:py-4">
          <div className={eventFormPcSectionHead}>
            <div className="mb-0.5 flex items-center gap-2 text-[15px] font-[600]">
              {infoIcon}
              詳細情報（任意）
            </div>
            <p className="text-[12px] text-[#888]">
              必要なときだけ入力してください。あとから編集できます
            </p>
          </div>

          <div
            id="event-form-pass-fields"
            className="min-w-0 space-y-3.5 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white p-3 min-[900px]:rounded-none min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:p-0 min-[900px]:overflow-visible"
          >
            {/* モバイル: カード内見出し */}
            <div className="min-[900px]:hidden border-b border-[#e8e6e0] pb-2.5">
              <div className="mb-0.5 flex items-center gap-1.5 text-[13px] font-[600]">
                {infoIcon}
                詳細情報（任意）
              </div>
              <p className="text-[11px] text-[#888]">
                必要なときだけ入力してください。あとから編集できます
              </p>
            </div>

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
                    registrationNote: e.target.value.slice(0, 500) || undefined,
                  }))
                }
                rows={4}
                maxLength={500}
                placeholder="参加者への特記事項があれば入力してください。キャンセルポリシーや注意事項など。"
                className={`${eventFormInp} resize-none`}
              />
              <div className="mt-1 flex justify-end">
                <span className="tabular-nums text-[11px] text-[#888]">
                  {noteLen}/500
                </span>
              </div>
            </div>
          </div>

          {/* モバイル: 公開後設定カード */}
          <div className="mt-4 min-[900px]:hidden pb-2">
            <div className="mb-0.5 text-[13px] font-[600] text-[#888]">
              公開後に設定できること
            </div>
            <p className="mb-2.5 text-[11px] leading-snug text-[#888]">
              イベント公開後にこれらの機能を追加できます
            </p>
            <PostPublishFeatures
              eventId={eventId}
              onOpenPassSettings={onOpenPassSettings}
              form={postPublishForm}
            />
          </div>
        </div>

        <div className="hidden min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:overflow-y-auto min-[900px]:px-5 min-[900px]:py-4">
          <div className="flex flex-col pb-1">
            <div className="mb-2.5 shrink-0 border-b border-[#e8e6e0] pb-2">
              <div className="mb-0.5 text-[14px] font-[600] text-[#888]">
                公開後に設定できること
              </div>
              <p className="text-[11px] leading-snug text-[#888]">
                イベント公開後にこれらの機能を追加できます
              </p>
            </div>
            <PostPublishFeatures
              eventId={eventId}
              onOpenPassSettings={onOpenPassSettings}
              form={postPublishForm}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

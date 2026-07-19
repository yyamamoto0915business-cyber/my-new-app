"use client";

import { Lock, Monitor, Shield } from "lucide-react";
import {
  ONLINE_GUIDE_MESSAGE_MAX,
  ONLINE_LINK_DISPLAY_TIMING_OPTIONS,
  ONLINE_SERVICE_OPTIONS,
  type OnlineLinkDisplayTiming,
  type OnlineService,
} from "@/lib/event-online";
import {
  EventFormError,
  EventFormLabel,
  eventFormInp,
  eventFormInpErr,
  eventFormInpSm,
} from "@/components/organizer/events/event-form-ui";

type Props = {
  onlineService: OnlineService | null | undefined;
  onlineJoinUrl: string;
  onlineMeetingId: string;
  onlinePasscode: string;
  onlineGuideMessage: string;
  timing: OnlineLinkDisplayTiming;
  errors: Record<string, string>;
  /** PCフォーム向けのコンパクト表示（ハイブリッド時はさらに詰める） */
  compact?: boolean;
  /** ハイブリッドなど縦スペースが厳しいとき用 */
  dense?: boolean;
  onChange: (patch: {
    onlineService?: OnlineService | null;
    onlineJoinUrl?: string;
    onlineMeetingId?: string;
    onlinePasscode?: string;
    onlineGuideMessage?: string;
  }) => void;
  onTimingChange: (value: OnlineLinkDisplayTiming) => void;
};

/** オンライン参加設定 + 配信設定を1カードにまとめて縦スクロールを抑制 */
export function OnlineParticipationSettingsCard({
  onlineService,
  onlineJoinUrl,
  onlineMeetingId,
  onlinePasscode,
  onlineGuideMessage,
  timing,
  errors,
  compact,
  dense,
  onChange,
  onTimingChange,
}: Props) {
  const inp = compact || dense ? eventFormInpSm : eventFormInp;
  const guideLen = onlineGuideMessage.length;
  const hasGuide = onlineGuideMessage.trim().length > 0;

  return (
    <div
      className={[
        "min-w-0 overflow-hidden rounded-[10px] border border-[#e8e6e0] bg-white",
        dense ? "p-2" : compact ? "p-2.5" : "p-3",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-1.5 font-[600] text-[#1a1a1a]",
          dense ? "mb-1 text-[12.5px]" : "mb-1.5 text-[13px]",
        ].join(" ")}
      >
        <Monitor className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
        オンライン参加設定
      </div>

      <div className={dense ? "space-y-1" : "space-y-1.5"}>
        <div className={dense ? "grid grid-cols-2 gap-1.5" : undefined}>
          <div>
            <EventFormLabel label="配信サービス" required />
            <select
              value={onlineService ?? ""}
              onChange={(e) =>
                onChange({
                  onlineService: (e.target.value || null) as OnlineService | null,
                })
              }
              className={`${inp} ${errors.onlineService ? eventFormInpErr : ""}`}
            >
              <option value="">選択してください</option>
              {ONLINE_SERVICE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <EventFormError msg={errors.onlineService} />
          </div>

          {dense ? (
            <div>
              <EventFormLabel label="表示タイミング" />
              <select
                value={timing}
                onChange={(e) =>
                  onTimingChange(e.target.value as OnlineLinkDisplayTiming)
                }
                className={inp}
                aria-label="表示タイミング"
              >
                {ONLINE_LINK_DISPLAY_TIMING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.recommended ? `${opt.label}（推奨）` : opt.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <EventFormLabel label="参加URL" required />
          <input
            type="url"
            value={onlineJoinUrl}
            onChange={(e) => onChange({ onlineJoinUrl: e.target.value })}
            placeholder="https://zoom.us/j/1234567890"
            className={`${inp} min-w-0 ${errors.onlineJoinUrl ? eventFormInpErr : ""}`}
          />
          <EventFormError msg={errors.onlineJoinUrl} />
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <EventFormLabel label="ミーティングID" opt="任意" />
            <input
              value={onlineMeetingId}
              onChange={(e) => onChange({ onlineMeetingId: e.target.value })}
              placeholder="例：123 456 7890"
              className={inp}
            />
          </div>
          <div>
            <EventFormLabel label="パスコード" opt="任意" />
            <input
              value={onlinePasscode}
              onChange={(e) => onChange({ onlinePasscode: e.target.value })}
              placeholder="例：ABC123"
              className={inp}
            />
          </div>
        </div>

        {dense ? (
          <details className="rounded-[8px] border border-[#e8e6e0] bg-[#fafaf8]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-[11.5px] font-medium text-[#4a4844] [&::-webkit-details-marker]:hidden">
              <span>参加案内メッセージ</span>
              <span className="text-[10.5px] font-normal text-[#888]">
                {hasGuide ? "設定済" : "任意"}
              </span>
            </summary>
            <div className="border-t border-[#e8e6e0] px-2.5 pb-2 pt-1.5">
              <textarea
                value={onlineGuideMessage}
                onChange={(e) =>
                  onChange({
                    onlineGuideMessage: e.target.value.slice(0, ONLINE_GUIDE_MESSAGE_MAX),
                  })
                }
                rows={2}
                maxLength={ONLINE_GUIDE_MESSAGE_MAX}
                placeholder="例：開始10分前から参加できます。"
                className={`${inp} min-h-[44px] resize-y ${errors.onlineGuideMessage ? eventFormInpErr : ""}`}
              />
              <div className="mt-0.5 flex justify-end">
                <span className="text-[10px] tabular-nums text-[#888]">
                  {guideLen} / {ONLINE_GUIDE_MESSAGE_MAX}
                </span>
              </div>
              <EventFormError msg={errors.onlineGuideMessage} />
            </div>
          </details>
        ) : (
          <div>
            <EventFormLabel label="参加案内メッセージ" opt="任意" />
            <textarea
              value={onlineGuideMessage}
              onChange={(e) =>
                onChange({
                  onlineGuideMessage: e.target.value.slice(0, ONLINE_GUIDE_MESSAGE_MAX),
                })
              }
              rows={1}
              maxLength={ONLINE_GUIDE_MESSAGE_MAX}
              placeholder="例：開始10分前から参加できます。"
              className={`${inp} min-h-[36px] resize-y ${errors.onlineGuideMessage ? eventFormInpErr : ""}`}
            />
            <div className="mt-0.5 flex justify-end">
              <span className="text-[10.5px] tabular-nums text-[#888]">
                {guideLen} / {ONLINE_GUIDE_MESSAGE_MAX}
              </span>
            </div>
            <EventFormError msg={errors.onlineGuideMessage} />
          </div>
        )}

        {dense ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] leading-snug text-[#5c5a54]">
            <span className="inline-flex items-center gap-0.5">
              <Shield className="h-3 w-3 text-[#6a8a72]" aria-hidden />
              パス取得者のみ表示
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Lock className="h-3 w-3 text-[#6a5a30]" aria-hidden />
              公開ページ非表示
            </span>
          </p>
        ) : (
          <div className="border-t border-[#f0eeea] pt-1.5">
            <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#5c5a54]">
              <span>表示：参加パス取得者のみ</span>
              <span className="inline-flex items-center gap-0.5">
                <Shield className="h-3 w-3 text-[#6a8a72]" aria-hidden />
                公開ページは非表示
              </span>
            </div>
            <EventFormLabel label="表示タイミング" />
            <select
              value={timing}
              onChange={(e) =>
                onTimingChange(e.target.value as OnlineLinkDisplayTiming)
              }
              className={inp}
              aria-label="表示タイミング"
            >
              {ONLINE_LINK_DISPLAY_TIMING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.recommended ? `${opt.label}（推奨）` : opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-[#6a5a30]">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              リンクは参加パスを通じて参加者に配信されます
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { ClipboardPen, Search, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { step: 1, label: "イベントを見つける", icon: Search },
  { step: 2, label: "申し込む", icon: ClipboardPen },
  { step: 3, label: "パスを表示", icon: Ticket },
] as const;

type Props = {
  /**
   * mobile: 白カード＋番号→アイコンの横3列（狭い幅は縦）
   * horizontal: PC右パネル用のコンパクト横並び
   * vertical: 縦並び（フォールバック）
   */
  orientation?: "mobile" | "horizontal" | "vertical";
  className?: string;
};

export function ParticipationPassSteps({
  orientation = "mobile",
  className,
}: Props) {
  if (orientation === "horizontal") {
    return (
      <section
        aria-label="参加パスが表示されるまでの流れ"
        className={cn(
          "rounded-xl border border-[#dce8de] bg-[#f7fbf8] px-3.5 py-3.5",
          className
        )}
      >
        <h3 className="mb-3 text-center text-[12px] font-semibold text-[#1a2818]">
          参加パスが表示されるまでの流れ
        </h3>
        <ol className="flex items-start">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === STEPS.length - 1;
            return (
              <li key={item.step} className="flex min-w-0 flex-1 items-start">
                <div className="flex w-full flex-col items-center gap-1.5 px-0.5 text-center">
                  <span className="relative" aria-hidden>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4a9a68] text-white">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#4a9a68] ring-1 ring-[#c8dece]">
                      {item.step}
                    </span>
                  </span>
                  <span className="text-[10.5px] font-medium leading-snug text-[#3a4840]">
                    {item.label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    className="mt-4 h-px w-3 shrink-0 border-t border-dashed border-[#c8d8cc]"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-2.5 text-center text-[10px] leading-snug text-[#6a7468]">
          ※ 参加方法はイベントによって異なります
        </p>
      </section>
    );
  }

  if (orientation === "vertical") {
    return (
      <section
        aria-label="参加パスが表示されるまでの流れ"
        className={cn(
          "rounded-[20px] border border-[#dce8de] bg-white px-4 py-5 shadow-[0_4px_16px_rgba(40,60,48,0.05)]",
          className
        )}
      >
        <h3 className="text-center text-[14px] font-semibold text-[#1a2818]">
          参加パスが表示されるまで
        </h3>
        <ol className="mt-4 space-y-0">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === STEPS.length - 1;
            return (
              <li key={item.step} className="relative flex items-start gap-3">
                {!isLast && (
                  <span
                    className="absolute left-[15px] top-[32px] h-[calc(100%-8px)] w-px border-l border-dashed border-[#d8e8dc]"
                    aria-hidden
                  />
                )}
                <span
                  className="relative z-[1] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#4a9a68] text-[12px] font-bold text-white"
                  aria-hidden
                >
                  {item.step}
                </span>
                <div className="flex min-h-[44px] flex-1 items-center gap-2 pb-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef6f0]"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4 text-[#4a9a68]" strokeWidth={2} />
                  </span>
                  <span className="text-[13px] font-medium text-[#3a4840]">
                    {item.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-1 text-center text-[11px] leading-snug text-[#6a7468]">
          ※ 参加方法はイベントによって異なります
        </p>
      </section>
    );
  }

  // mobile（デフォルト）: 横3列・番号をアイコンに重ねて高さを抑える
  return (
    <section
      aria-label="参加パスが表示されるまでの流れ"
      className={cn(
        "rounded-[16px] border border-[#dce8de] bg-white px-3 py-3.5 shadow-[0_4px_16px_rgba(40,60,48,0.05)]",
        className
      )}
    >
      <h3 className="text-center text-[13px] font-semibold text-[#1a2818]">
        参加パスが表示されるまで
      </h3>

      <ol className="mt-3 flex items-start">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === STEPS.length - 1;
          return (
            <li
              key={item.step}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {!isLast && (
                <span
                  className="pointer-events-none absolute left-[calc(50%+18px)] top-[16px] h-px w-[calc(100%-36px)] border-t border-dashed border-[#c8d8cc]"
                  aria-hidden
                />
              )}

              <span className="relative" aria-hidden>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef6f0]">
                  <Icon className="h-4 w-4 text-[#4a9a68]" strokeWidth={2} />
                </span>
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4a9a68] text-[9px] font-bold text-white">
                  {item.step}
                </span>
              </span>
              <span className="mt-1.5 px-0.5 text-[10.5px] font-medium leading-snug text-[#3a4840]">
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-2.5 text-center text-[10px] leading-snug text-[#6a7468]">
        ※ 参加方法はイベントによって異なります
      </p>
    </section>
  );
}

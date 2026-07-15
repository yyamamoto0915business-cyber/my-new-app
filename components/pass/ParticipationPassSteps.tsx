import Image from "next/image";
import { ClipboardPen, Search, Ticket } from "lucide-react";

const STEPS = [
  { step: 1, label: "イベントを見つける", icon: Search },
  { step: 2, label: "申し込む", icon: ClipboardPen },
  { step: 3, label: "パスを表示", icon: Ticket },
] as const;

export function ParticipationPassSteps() {
  return (
    <section
      aria-label="参加パスが表示されるまでの流れ"
      className="rounded-[20px] border border-[#dce8de] bg-white px-4 py-4 shadow-[0_4px_16px_rgba(40,60,48,0.05)]"
    >
      <div className="mb-3 flex items-center justify-center">
        <Image
          src="/assets/machiglyph/pass/pass-empty-flow.png"
          alt=""
          width={120}
          height={80}
          className="h-[72px] w-auto object-contain"
          aria-hidden
        />
      </div>

      <h3 className="text-center text-[13px] font-semibold text-[#1a2818]">
        参加パスが表示されるまで
      </h3>

      <ol className="mt-3 space-y-0">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === STEPS.length - 1;
          return (
            <li key={item.step} className="relative flex items-start gap-3">
              {!isLast && (
                <span
                  className="absolute left-[15px] top-[32px] h-[calc(100%-8px)] w-px bg-[#d8e8dc]"
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
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef6f0]"
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5 text-[#4a9a68]" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-medium text-[#3a4840]">{item.label}</span>
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

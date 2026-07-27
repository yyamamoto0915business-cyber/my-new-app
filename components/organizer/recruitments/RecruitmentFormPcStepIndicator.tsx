"use client";

/** PC募集作成の上部横ステッパー（イベント作成の EventFormPcStepIndicator に合わせる） */
export function RecruitmentFormPcStepIndicator({
  current,
  onGo,
  canGoTo,
}: {
  current: 1 | 2 | 3;
  onGo: (s: 1 | 2 | 3) => void;
  /** 未入力時に先のステップへ行けない場合など */
  canGoTo?: (s: 1 | 2 | 3) => boolean;
}) {
  const steps: Array<{ n: 1 | 2 | 3; label: string; isCheck?: boolean }> = [
    { n: 1, label: "基本情報" },
    { n: 2, label: "応募フォーム" },
    { n: 3, label: "確認・公開", isCheck: true },
  ];

  return (
    <nav
      aria-label="フォームステップ"
      className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-1 gap-y-1"
    >
      {steps.map(({ n, label, isCheck }, i) => {
        const isDone = current > n;
        const isActive = current === n;
        const isUpcoming = !isDone && !isActive;
        const allowed = canGoTo ? canGoTo(n) : true;

        const circleClass = isDone
          ? "border-transparent bg-[#6BBF3E] text-white"
          : isActive
            ? "border-transparent bg-[#2B3A6B] text-white shadow-[0_0_0_3px_rgba(43,58,107,0.14)]"
            : "border-[#c8c4bc] bg-white text-[#5c5a54]";

        const labelClass = isDone
          ? "font-semibold text-[#3d8a24]"
          : isActive
            ? "font-semibold text-[#2B3A6B]"
            : "font-medium text-[#5c5a54]";

        return (
          <div key={n} className="flex items-center gap-2">
            {i > 0 ? (
              <div
                aria-hidden
                className={[
                  "h-0.5 w-6 shrink-0 rounded-full sm:w-8",
                  current > n - 1 ? "bg-[#6BBF3E]" : "bg-[#d8d4cc]",
                ].join(" ")}
              />
            ) : null}
            <button
              type="button"
              disabled={!allowed && !isActive && !isDone}
              onClick={() => {
                if (allowed || isDone || isActive) onGo(n);
              }}
              className={[
                "flex shrink-0 items-center gap-2 rounded-full px-2 py-0.5 transition-colors",
                isActive ? "bg-[#EEF2FF]" : "hover:bg-[#f5f4f0]",
                !allowed && !isActive && !isDone ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              ].join(" ")}
            >
              <div
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  circleClass,
                ].join(" ")}
              >
                {isDone ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isCheck && isUpcoming ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="9 11 12 14 22 4" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span className={`whitespace-nowrap text-[12px] ${labelClass}`}>{label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

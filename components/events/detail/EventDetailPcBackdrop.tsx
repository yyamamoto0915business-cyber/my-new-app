import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/** PCイベント詳細の青海波風背景（モック準拠） */
export function EventDetailPcBackdrop({ children, className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        aria-hidden
      >
        <svg className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <pattern
              id="evt-detail-sg"
              x="0"
              y="0"
              width="44"
              height="25"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M22 0 Q44 12.5 22 25 Q0 12.5 22 0Z"
                fill="none"
                stroke="#d4c4a8"
                strokeWidth="0.9"
                opacity="0.45"
              />
              <path
                d="M0 12.5 Q22 25 44 12.5"
                fill="none"
                stroke="#d4c4a8"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#evt-detail-sg)" opacity="0.55" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f6]/40 via-transparent to-[#faf9f6]/60" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

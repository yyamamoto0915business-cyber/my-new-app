"use client";

/**
 * 靴の足あと（墨風・シルエット）
 * インクで捺されたような簡素な形状
 */
export function FootprintSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 80"
      className={className}
      aria-hidden
    >
      {/* 靴底シルエット：墨風に塗りつぶし */}
      <path
        d="M24 4 C12 4 6 16 6 28 C6 36 10 42 16 48 L18 72 C18 76 22 78 24 78 C26 78 30 76 30 72 L32 48 C38 42 42 36 42 28 C42 16 36 4 24 4 Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M22 8 C14 10 10 20 10 30 C10 38 13 44 18 50 L20 68 C20 72 22 74 24 74 C26 74 28 72 28 68 L30 50 C35 44 38 38 38 30 C38 20 34 10 26 8 Z"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

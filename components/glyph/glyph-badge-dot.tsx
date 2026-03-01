"use client";

type Props = {
  children: React.ReactNode;
  /** バリエーション（未読/緊急/カテゴリ） */
  variant?: "default" | "unread" | "emergency" | "category";
  className?: string;
};

const variantStyles = {
  default: "text-[var(--mg-muted)]",
  unread: "text-[var(--mg-accent)]",
  emergency: "text-red-600 dark:text-red-400",
  category: "text-[var(--mg-ink)] dark:text-[var(--mg-ink)]",
};

const dotStyles = {
  default: "bg-[var(--mg-muted)]",
  unread: "bg-[var(--mg-accent)]",
  emergency: "bg-red-600 dark:bg-red-400",
  category: "bg-[var(--mg-muted)]",
};

/**
 * 点＋短いラベルのバッジ（未読/緊急/カテゴリ）。
 * 墨の足あとの点を表現。
 */
export function GlyphBadgeDot({
  children,
  variant = "default",
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[variant]}`}
        aria-hidden
      />
      {children}
    </span>
  );
}

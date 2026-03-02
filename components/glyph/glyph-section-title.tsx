"use client";

type Props = {
  children: React.ReactNode;
  /** 見出しのレベル（h1〜h3） */
  as?: "h1" | "h2" | "h3";
  /** 追加のクラス名 */
  className?: string;
};

/** 見出しコンポーネント */
export function GlyphSectionTitle({ children, as: Tag = "h2", className = "" }: Props) {
  return (
    <div className={className}>
      <Tag className="font-serif text-lg font-semibold text-[var(--mg-ink)] dark:text-[var(--mg-ink)] sm:text-xl">
        {children}
      </Tag>
    </div>
  );
}

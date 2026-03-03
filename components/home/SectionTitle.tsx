"use client";

type Props = {
  title: string;
  /** 見出し横の小バッジ（例：選択中カテゴリ） */
  badge?: string;
};

export function SectionTitle({ title, badge }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
        {title}
      </h2>
      {badge && (
        <span className="rounded-md border border-[var(--border)] bg-white/80 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-[var(--background)] dark:text-zinc-400">
          {badge}
        </span>
      )}
    </div>
  );
}

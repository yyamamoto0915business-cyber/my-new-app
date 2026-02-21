"use client";

type Props = {
  label: string;
  targetId: string;
};

export function EventDetailClient({ label, targetId }: Props) {
  const scrollTo = () => {
    const el = document.getElementById(targetId);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={scrollTo}
          className="w-full rounded-xl bg-[var(--accent)] py-3 font-medium text-white transition-opacity hover:opacity-90"
        >
          {label}
        </button>
      </div>
    </div>
  );
}

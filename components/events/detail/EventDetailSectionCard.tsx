import { cn } from "@/lib/utils";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export function EventDetailSectionCard({
  title,
  children,
  className,
  compact = false,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--mg-line)] bg-white shadow-[0_1px_3px_rgba(44,42,40,0.04)]",
        compact ? "p-3.5" : "p-5",
        className
      )}
    >
      <h2
        className={cn(
          "font-semibold text-[var(--mg-ink)]",
          compact ? "text-[13px]" : "text-[15px]"
        )}
      >
        {title}
      </h2>
      <div className={compact ? "mt-2" : "mt-3"}>{children}</div>
    </section>
  );
}

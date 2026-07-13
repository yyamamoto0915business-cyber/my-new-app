import { Ticket, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSalesDeadlineLabel } from "@/lib/event-purchase";

type Props = {
  remainingCount: number | null;
  salesEndAt: string | null;
  /** 残数がこの値以下なら注意色 */
  lowStockThreshold?: number;
};

export function PassAvailability({
  remainingCount,
  salesEndAt,
  lowStockThreshold = 5,
}: Props) {
  const deadlineLabel = formatSalesDeadlineLabel(salesEndAt);
  const showRemaining = remainingCount !== null;
  const showDeadline = Boolean(deadlineLabel);
  if (!showRemaining && !showDeadline) return null;

  const isLowStock =
    remainingCount != null &&
    remainingCount > 0 &&
    remainingCount <= lowStockThreshold;

  const remainingBlock = showRemaining ? (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2.5">
      <Ticket
        className={cn(
          "h-4 w-4 shrink-0",
          isLowStock ? "text-[#d97706]" : "text-[#348b38]"
        )}
        aria-hidden
      />
      <p
        className={cn(
          "text-[12.5px] font-semibold leading-snug",
          isLowStock ? "text-[#c2410c]" : "text-[#348b38]"
        )}
      >
        残り <span className="tabular-nums">{remainingCount}</span> 枚
      </p>
    </div>
  ) : null;

  const deadlineBlock = showDeadline ? (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2.5">
      <Clock className="h-4 w-4 shrink-0 text-[#348b38]" aria-hidden />
      <p className="min-w-0 text-[12.5px] font-semibold leading-snug text-[#348b38]">
        申込締切 <span className="tabular-nums">{deadlineLabel}</span>
      </p>
    </div>
  ) : null;

  return (
    <div className="flex items-stretch overflow-hidden rounded-[10px] bg-[#eef6f0]">
      {remainingBlock}
      {showRemaining && showDeadline ? (
        <div className="w-px shrink-0 self-stretch bg-[#cfe0d1]" aria-hidden />
      ) : null}
      {deadlineBlock}
    </div>
  );
}

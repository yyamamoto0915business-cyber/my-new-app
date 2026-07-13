import { cn } from "@/lib/utils";
import {
  getPurchaseCtaLabel,
  isPurchaseCtaDisabled,
  type PurchaseCtaState,
} from "@/lib/event-purchase";

type Props = {
  state: PurchaseCtaState;
  loading?: boolean;
  onClick: () => void;
};

export function PurchaseButton({ state, loading = false, onClick }: Props) {
  const disabled = isPurchaseCtaDisabled(state) || loading;
  const label = loading ? "処理中..." : getPurchaseCtaLabel(state);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-[50px] w-full items-center justify-center rounded-xl text-[15px] font-bold transition",
        disabled
          ? "cursor-not-allowed bg-[#c5cec0] text-white"
          : "bg-[#348b38] text-white hover:bg-[#2d7a32] active:bg-[#276c2b]"
      )}
    >
      {label}
    </button>
  );
}

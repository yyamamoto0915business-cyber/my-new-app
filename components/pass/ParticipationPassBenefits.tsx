import { Clock, FolderOpen, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const BENEFITS = [
  {
    icon: FolderOpen,
    label: "参加パスをまとめて管理",
  },
  {
    icon: QrCode,
    label: "QRでスムーズに受付",
  },
  {
    icon: Clock,
    label: "参加履歴も確認できます",
  },
] as const;

type Props = {
  /** mobile / pc とも横3列。mobileは区切り線あり */
  layout?: "mobile" | "pc";
};

export function ParticipationPassBenefits({ layout = "mobile" }: Props) {
  const isMobile = layout === "mobile";

  return (
    <div className={cn("border-t border-[#e8f0ea]", isMobile ? "pt-3" : "pt-5")}>
      <p
        className={cn(
          "text-center font-medium text-[#6a7468]",
          isMobile ? "mb-2 text-[10.5px]" : "mb-3 text-[11px]"
        )}
      >
        参加パスを使うと、もっと便利に
      </p>
      <ul className="grid grid-cols-3 gap-0">
        {BENEFITS.map((item, index) => {
          const Icon = item.icon;
          const showDivider = index < BENEFITS.length - 1;
          return (
            <li
              key={item.label}
              className={cn(
                "flex flex-col items-center text-center",
                isMobile ? "px-1" : "px-1.5",
                showDivider && "border-r border-dashed border-[#d8e4da]"
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full bg-[#eef6f0]",
                  isMobile ? "h-8 w-8" : "h-10 w-10"
                )}
                aria-hidden
              >
                <Icon
                  className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4", "text-[#4a9a68]")}
                  strokeWidth={2}
                />
              </span>
              <span
                className={cn(
                  "font-medium leading-snug text-[#3a4840]",
                  isMobile ? "mt-1.5 text-[10px]" : "mt-2 text-[11.5px]"
                )}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

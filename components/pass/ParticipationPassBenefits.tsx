import { Clock, FolderOpen, QrCode } from "lucide-react";

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

export function ParticipationPassBenefits() {
  return (
    <div className="border-t border-[#e8f0ea] pt-4">
      <p className="mb-3 text-center text-[11px] font-medium text-[#6a7468]">
        参加パスを使うと、もっと便利に
      </p>
      <ul className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
        {BENEFITS.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === BENEFITS.length - 1;
          return (
            <li
              key={item.label}
              className={`flex min-h-[44px] items-center gap-2.5 ${
                isLast ? "min-[380px]:col-span-2 min-[380px]:justify-center" : ""
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef6f0]"
                aria-hidden
              >
                <Icon className="h-4 w-4 text-[#4a9a68]" strokeWidth={2} />
              </span>
              <span className="text-[12.5px] font-medium leading-snug text-[#3a4840]">
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

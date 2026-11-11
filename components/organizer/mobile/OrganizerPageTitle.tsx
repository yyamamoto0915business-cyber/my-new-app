import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
};

/** 主催者モードの各ページの見出し（見本：大きなタイトル＋説明＋右に角丸のアイコン） */
export function OrganizerPageTitle({ title, subtitle, Icon }: Props) {
  return (
    <header className="flex items-start justify-between gap-3 pt-1">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[#163828]">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] leading-snug text-[#6b776f]">{subtitle}</p> : null}
      </div>
      {Icon ? (
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#e8f3ec] text-[#1f7a4a]"
          aria-hidden
        >
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
    </header>
  );
}

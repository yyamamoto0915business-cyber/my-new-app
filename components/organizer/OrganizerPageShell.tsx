import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 旧ヒーローバナー用 — main padding-top を相殺 */
export const organizerPageShellHeroClass =
  "pt-1 -mt-3 sm:-mt-6 min-[900px]:-mt-8 min-[900px]:pt-0";

/** 上部タブ配下の通常ページ（負のマージンなし） */
export const organizerPageShellWorkspaceClass = "relative z-[1]";

/** @deprecated organizerPageShellHeroClass を使用 */
export const organizerPageShellClass = organizerPageShellHeroClass;

/** ヒーローバナーを main の左右 padding まで広げる */
export const organizerHeroBleedClass = "-mx-4 sm:-mx-6 min-[900px]:-mx-8";

/** dense ヒーローのローディング用 */
export const organizerHeroDenseSkeletonClass =
  "h-[50px] min-[900px]:h-[52px] animate-pulse border-b-[3px] border-[#c8a84b] bg-[#c0d8e4]";

type OrganizerPageShellProps = {
  children: ReactNode;
  className?: string;
  /** hero: 旧ヒーローバナー / workspace: 上部タブ配下（デフォルト） */
  variant?: "hero" | "workspace";
  /** デフォルト: space-y-2 min-[900px]:space-y-2.5 + pb-16 */
  contentClassName?: string;
};

export function OrganizerPageShell({
  children,
  className,
  variant = "workspace",
  contentClassName = "space-y-2 pb-16 min-[900px]:space-y-2.5 min-[900px]:pb-0",
}: OrganizerPageShellProps) {
  const variantClass =
    variant === "hero" ? organizerPageShellHeroClass : organizerPageShellWorkspaceClass;

  return (
    <div className={cn(contentClassName, variantClass, className)}>
      {children}
    </div>
  );
}

type OrganizerHeroBleedProps = {
  children: ReactNode;
  className?: string;
  /** true のとき PC のみ表示 */
  pcOnly?: boolean;
};

export function OrganizerHeroBleed({ children, className, pcOnly = false }: OrganizerHeroBleedProps) {
  return (
    <div
      className={cn(organizerHeroBleedClass, pcOnly && "hidden min-[900px]:block", className)}
    >
      {children}
    </div>
  );
}

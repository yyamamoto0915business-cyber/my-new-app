"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  shouldShowOrganizerMainHeroBg,
  type OrganizerNavVariant,
} from "@/lib/organizer/organizer-nav";

type Props = {
  children: ReactNode;
  variant: OrganizerNavVariant;
};

/** 主催者メインエリア — 背景イラスト（セクション切替は左サイドバーのみ） */
export function OrganizerMainChrome({ children, variant }: Props) {
  const pathname = usePathname() ?? "";
  const showHeroBg = variant === "full" && shouldShowOrganizerMainHeroBg(pathname);

  return (
    <div className={showHeroBg ? "org-main-chrome" : "org-main-chrome org-main-chrome--plain"}>
      {showHeroBg ? <div className="org-main-chrome__bg" aria-hidden /> : null}
      <div className="org-main-chrome__content">{children}</div>
    </div>
  );
}

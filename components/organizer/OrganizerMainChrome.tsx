"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { OrganizerTopTabs } from "@/components/organizer/OrganizerTopTabs";
import {
  shouldShowOrganizerTopTabs,
  type OrganizerNavVariant,
} from "@/lib/organizer/organizer-nav";

type Props = {
  children: ReactNode;
  variant: OrganizerNavVariant;
};

/** 主催者メインエリア — 背景イラスト + 上部タブ */
export function OrganizerMainChrome({ children, variant }: Props) {
  const pathname = usePathname() ?? "";
  const showTabs = variant === "full" && shouldShowOrganizerTopTabs(pathname);

  return (
    <div className={showTabs ? "org-main-chrome" : "org-main-chrome org-main-chrome--plain"}>
      {showTabs ? (
        <>
          <div className="org-main-chrome__bg" aria-hidden />
          <div className="org-main-chrome__tabs-wrap">
            <OrganizerTopTabs />
          </div>
        </>
      ) : null}
      <div className="org-main-chrome__content">{children}</div>
    </div>
  );
}

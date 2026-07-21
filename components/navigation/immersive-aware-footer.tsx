"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { getSiteFooterVisibility } from "@/lib/site-footer-visibility";

/** 会話詳細・メッセージ一覧などフルスクリーンに近い画面ではフッターを出さず本文領域を確保する */
export function ImmersiveAwareFooter() {
  const pathname = usePathname();
  const visibility = getSiteFooterVisibility(pathname ?? "");

  if (visibility === "hidden") return null;

  if (visibility === "desktop-only") {
    return (
      <div className="hidden min-[900px]:block">
        <SiteFooter />
      </div>
    );
  }

  return <SiteFooter />;
}

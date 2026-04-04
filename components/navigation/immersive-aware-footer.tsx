"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";

/** 会話詳細などフルスクリーンに近い画面ではフッターを出さず本文領域を確保する */
export function ImmersiveAwareFooter() {
  const pathname = usePathname();
  if (isMessagesConversationRoute(pathname ?? "")) return null;
  return (
    <div className="sm:block">
      <SiteFooter />
    </div>
  );
}

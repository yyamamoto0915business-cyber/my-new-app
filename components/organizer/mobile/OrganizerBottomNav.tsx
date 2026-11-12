"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MessageCircle, Plus, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isEventFormRoute } from "@/lib/is-event-form-route";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";
import { isProfileEditRoute } from "@/lib/is-profile-edit-route";
import { ORGANIZER_MESSAGES_HREF } from "@/lib/messages-scope";
import { useOrganizerUnreadCount } from "@/hooks/use-scoped-unread-count";
import {
  ORGANIZER_MOBILE_HOME_HREF,
  ORGANIZER_NEW_LISTING_HREF,
  organizerBottomNavActive,
  type OrganizerBottomNavId,
} from "@/lib/organizer/organizer-nav";

type Item = {
  id: OrganizerBottomNavId;
  href: string;
  label: string;
  Icon: LucideIcon;
};

const ITEMS: Item[] = [
  { id: "home", href: ORGANIZER_MOBILE_HOME_HREF, label: "ホーム", Icon: Home },
  { id: "listings", href: "/organizer/listings", label: "掲載管理", Icon: CalendarDays },
  { id: "new", href: ORGANIZER_NEW_LISTING_HREF, label: "新しく掲載", Icon: Plus },
  { id: "chat", href: ORGANIZER_MESSAGES_HREF, label: "チャット", Icon: MessageCircle },
  { id: "mypage", href: "/organizer/settings", label: "マイページ", Icon: User },
];

/**
 * 主催者モードのスマホ下部ナビ（ホーム／掲載管理／＋新しく掲載／チャット／マイページ）。
 * 前は4つ目が「運営」だったが、中身がホームと重なっていたので、道具はホームにまとめ、主催者のチャットにした。
 * 画面の下にぴったり付く帯（利用者側と同じ）。真ん中の「新しく掲載」は丸いボタンにして少し浮かせる。
 */
export function OrganizerBottomNav() {
  const pathname = usePathname() ?? "";
  const hidden =
    isEventFormRoute(pathname) || isMessagesConversationRoute(pathname) || isProfileEditRoute(pathname);
  const unread = useOrganizerUnreadCount(!hidden);

  // 作成・編集フォーム・プロフィール編集と、会話を開いているときは入力に集中させる（利用者側と同じ）
  if (hidden) return null;

  const activeId = organizerBottomNavActive(pathname);

  return (
    <nav
      data-mg-chrome="mobile-bottom"
      aria-label="主催者メニュー"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#dde9e1] bg-[#f7fbf8]/98 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(22,56,40,0.05)] backdrop-blur-sm min-[900px]:hidden"
    >
      <div className="mx-auto flex w-full items-end justify-around px-1 py-0.5 tablet:max-w-[560px]">
        {ITEMS.map(({ id, href, label, Icon }) => {
          const active = activeId === id;
          if (id === "new") {
            return (
              <Link
                key={id}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-[52px] flex-1 touch-manipulation flex-col items-center justify-end gap-0.5 pb-1 text-[10px] font-bold text-[#1f5e3a]"
              >
                <span className="-mt-6 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-b from-[#2f7d4e] to-[#1f5e3a] text-white shadow-[0_6px_16px_rgba(22,56,40,0.32)] ring-4 ring-white">
                  <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="whitespace-nowrap leading-tight">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={id}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[52px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[20px] px-0.5 py-1 text-[10px] transition-colors",
                active ? "bg-[#eaf4ed] font-bold text-[#1f5e3a]" : "font-medium text-[#7a8a80]"
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.3 : 2} aria-hidden />
                {id === "chat" && unread > 0 ? (
                  <span
                    className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-[#d0567a] px-1 text-center text-[10px] font-bold leading-[18px] text-white"
                    aria-label={`未読 ${unread}件`}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </span>
              <span className="whitespace-nowrap leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

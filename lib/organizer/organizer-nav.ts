export type OrganizerNavVariant = "full" | "lite";

/** 主催モードの入口（掲載管理）。PC のサイドバーなどで使う */
export const ORGANIZER_HOME_HREF = "/organizer/listings";

/** スマホの主催者ホーム（見本「01_ホーム」） */
export const ORGANIZER_MOBILE_HOME_HREF = "/organizer/home";
/** 新しく掲載する（種類を選ぶ）。スマホ下部ナビの真ん中 */
export const ORGANIZER_NEW_LISTING_HREF = "/organizer/new";
/** 旧「運営」タブ（今はホームへ移す）。古いリンクのために残す */
export const ORGANIZER_TOOLS_HREF = "/organizer/tools";

export type OrganizerBottomNavId = "home" | "listings" | "new" | "chat" | "mypage";

/** スマホ下部ナビで、いまのページがどの項目に入るか */
export function organizerBottomNavActive(pathname: string): OrganizerBottomNavId | null {
  if (pathname === ORGANIZER_MOBILE_HOME_HREF) return "home";
  if (pathname === ORGANIZER_NEW_LISTING_HREF || /^\/organizer\/[^/]+\/new\/?$/.test(pathname)) {
    return "new";
  }
  if (pathname === "/organizer/settings" || pathname.startsWith("/organizer/settings/")) {
    return "mypage";
  }
  if (pathname === "/organizer/messages" || pathname.startsWith("/organizer/messages/")) return "chat";
  // 当日の運営・レジ・ゲームはホームの「よく使う」から行くので、ホームを光らせる
  if (
    pathname === ORGANIZER_TOOLS_HREF ||
    pathname === "/organizer" ||
    pathname === "/organizer/day" ||
    /^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname) ||
    pathname.startsWith("/organizer/pos") ||
    pathname.startsWith("/organizer/games") ||
    pathname.startsWith("/organizer/inbox")
  ) {
    return "home";
  }
  if (organizerSidebarNavIsActive(pathname, "/organizer/listings")) return "listings";
  return null;
}

/** 左サイドバー（セクション切替はここだけ）。shortLabel はモバイルタブ専用 */
export const ORGANIZER_SIDEBAR_NAV_ITEMS = [
  { label: "掲載管理", shortLabel: "掲載", href: "/organizer/listings" },
  { label: "当日の運営", shortLabel: "当日", href: "/organizer" },
  { label: "レジ・当日販売", shortLabel: "レジ", href: "/organizer/pos", badge: "NEW" },
  { label: "ゲーム機能", shortLabel: "ゲーム", href: "/organizer/games", badge: "NEW" },
  { label: "チャット", shortLabel: "チャット", href: "/organizer/messages" },
  { label: "主催者プラン", shortLabel: "プラン", href: "/organizer/settings/plan" },
] as const;

/** @deprecated ORGANIZER_SIDEBAR_NAV_ITEMS を使用 */
export const ORGANIZER_FULL_NAV_ITEMS = ORGANIZER_SIDEBAR_NAV_ITEMS;

/** @deprecated 上部タブは廃止。ORGANIZER_SIDEBAR_NAV_ITEMS を使用 */
export const ORGANIZER_TOP_TAB_ITEMS = ORGANIZER_SIDEBAR_NAV_ITEMS;

export const ORGANIZER_LITE_NAV_ITEMS = [
  { label: "主催者登録", href: "/organizer/register" },
  // 料金プランは主催者登録のあとで見られる（登録前に開くと「登録が必要です」になるため）
  { label: "使い方", href: "/guide" },
  { label: "イベントを探す", href: "/events" },
] as const;

/** メインエリアのヒーロー背景を出すルートか（旧上部タブ表示ルート） */
export function shouldShowOrganizerMainHeroBg(pathname: string): boolean {
  if (pathname === "/organizer" || pathname === "/organizer/") return true;
  if (pathname === "/organizer/day" || pathname === "/organizer/day/") return true;
  if (/^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname)) return true;
  if (pathname === "/organizer/listings" || pathname.startsWith("/organizer/listings/")) {
    return true;
  }
  if (pathname === "/organizer/events" || pathname.startsWith("/organizer/events/")) return true;
  if (pathname === "/organizer/stores" || pathname.startsWith("/organizer/stores/")) return true;
  if (
    pathname === "/organizer/kitchen-cars" ||
    pathname.startsWith("/organizer/kitchen-cars/")
  ) {
    return true;
  }
  if (pathname === "/organizer/recruitments" || pathname.startsWith("/organizer/recruitments/")) {
    return true;
  }
  if (pathname.startsWith("/organizer/settings/plan")) return true;
  if (pathname.startsWith("/organizer/settings/payouts")) return true;
  if (pathname === "/organizer/pos" || pathname.startsWith("/organizer/pos/")) return true;
  if (pathname === "/organizer/games" || pathname.startsWith("/organizer/games/")) return true;
  return false;
}

/** @deprecated shouldShowOrganizerMainHeroBg を使用 */
export function shouldShowOrganizerTopTabs(pathname: string): boolean {
  return shouldShowOrganizerMainHeroBg(pathname);
}

/** 左サイドバーの active 判定 */
export function organizerSidebarNavIsActive(pathname: string, href: string): boolean {
  if (href === "/organizer") {
    return (
      pathname === "/organizer" ||
      pathname === "/organizer/" ||
      pathname === "/organizer/day" ||
      pathname === "/organizer/day/" ||
      /^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname)
    );
  }
  if (href === "/organizer/listings") {
    if (/^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname)) return false;
    if (pathname === "/organizer/listings" || pathname.startsWith("/organizer/listings/")) {
      return true;
    }
    if (pathname === "/organizer/events" || pathname.startsWith("/organizer/events/")) {
      return true;
    }
    if (pathname === "/organizer/stores" || pathname.startsWith("/organizer/stores/")) {
      return true;
    }
    if (
      pathname === "/organizer/kitchen-cars" ||
      pathname.startsWith("/organizer/kitchen-cars/")
    ) {
      return true;
    }
    if (pathname === "/organizer/recruitments" || pathname.startsWith("/organizer/recruitments/")) {
      return true;
    }
    return false;
  }
  if (href === "/organizer/settings/plan") {
    return pathname === "/organizer/settings/plan" || pathname.startsWith("/organizer/settings/plan/");
  }
  if (href === "/organizer/settings/payouts") {
    return (
      pathname === "/organizer/settings/payouts" ||
      pathname.startsWith("/organizer/settings/payouts/")
    );
  }
  if (href === "/organizer/pos") {
    return pathname === "/organizer/pos" || pathname.startsWith("/organizer/pos/");
  }
  if (href === "/organizer/games") {
    return pathname === "/organizer/games" || pathname.startsWith("/organizer/games/");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

/** @deprecated organizerSidebarNavIsActive を使用 */
export function organizerTopTabIsActive(pathname: string, href: string): boolean {
  return organizerSidebarNavIsActive(pathname, href);
}

/** @deprecated organizerSidebarNavIsActive を使用 */
export function organizerNavIsActive(pathname: string, href: string): boolean {
  return organizerSidebarNavIsActive(pathname, href);
}

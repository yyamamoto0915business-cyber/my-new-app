export type OrganizerNavVariant = "full" | "lite";

/** 主催モードの入口（掲載管理） */
export const ORGANIZER_HOME_HREF = "/organizer/listings";

/** 左サイドバー（セクション切替はここだけ） */
export const ORGANIZER_SIDEBAR_NAV_ITEMS = [
  { label: "掲載管理", href: "/organizer/listings" },
  { label: "ダッシュボード", href: "/organizer" },
  { label: "クレジット・オンライン決済", href: "/organizer/settings/payouts" },
  { label: "主催者プラン", href: "/organizer/settings/plan" },
] as const;

/** @deprecated ORGANIZER_SIDEBAR_NAV_ITEMS を使用 */
export const ORGANIZER_FULL_NAV_ITEMS = ORGANIZER_SIDEBAR_NAV_ITEMS;

/** @deprecated 上部タブは廃止。ORGANIZER_SIDEBAR_NAV_ITEMS を使用 */
export const ORGANIZER_TOP_TAB_ITEMS = ORGANIZER_SIDEBAR_NAV_ITEMS;

export const ORGANIZER_LITE_NAV_ITEMS = [
  { label: "主催者登録", href: "/organizer/register" },
  { label: "料金プラン", href: "/organizer/settings/plan" },
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

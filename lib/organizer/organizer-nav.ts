export type OrganizerNavVariant = "full" | "lite";

/** 左サイドバー（3項目のみ） */
export const ORGANIZER_SIDEBAR_NAV_ITEMS = [
  { label: "ダッシュボード", href: "/organizer" },
  { label: "受信箱", href: "/organizer/inbox" },
  { label: "設定", href: "/organizer/settings" },
] as const;

/** @deprecated ORGANIZER_SIDEBAR_NAV_ITEMS を使用 */
export const ORGANIZER_FULL_NAV_ITEMS = ORGANIZER_SIDEBAR_NAV_ITEMS;

/** メインエリア上部タブ（5項目） */
export const ORGANIZER_TOP_TAB_ITEMS = [
  { label: "ダッシュボード", href: "/organizer" },
  { label: "イベント管理", href: "/organizer/events" },
  { label: "スタッフ募集", href: "/organizer/recruitments" },
  { label: "主催者プラン", href: "/organizer/settings/plan" },
  {
    label: "クレジット決済・オンライン支払い設定",
    href: "/organizer/settings/payouts",
    multiline: true,
  },
] as const;

export const ORGANIZER_LITE_NAV_ITEMS = [
  { label: "主催者登録", href: "/organizer/register" },
  { label: "料金プラン", href: "/organizer/settings/plan" },
  { label: "イベントを探す", href: "/events" },
] as const;

/** 上部タブを表示するルートか */
export function shouldShowOrganizerTopTabs(pathname: string): boolean {
  if (pathname === "/organizer" || pathname === "/organizer/") return true;
  if (pathname === "/organizer/day" || pathname === "/organizer/day/") return true;
  if (/^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname)) return true;
  if (pathname === "/organizer/events" || pathname.startsWith("/organizer/events/")) return true;
  if (pathname === "/organizer/recruitments" || pathname.startsWith("/organizer/recruitments/")) {
    return true;
  }
  if (pathname.startsWith("/organizer/settings/plan")) return true;
  if (pathname.startsWith("/organizer/settings/payouts")) return true;
  return false;
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
  if (href === "/organizer/settings") {
    if (pathname.startsWith("/organizer/settings/plan")) return false;
    if (pathname.startsWith("/organizer/settings/payouts")) return false;
    return pathname === "/organizer/settings" || pathname.startsWith("/organizer/settings/");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

/** 上部タブの active 判定 */
export function organizerTopTabIsActive(pathname: string, href: string): boolean {
  if (href === "/organizer") {
    return (
      pathname === "/organizer" ||
      pathname === "/organizer/" ||
      pathname === "/organizer/day" ||
      pathname === "/organizer/day/" ||
      /^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname)
    );
  }
  if (href === "/organizer/events") {
    if (/^\/organizer\/events\/[^/]+\/day\/?$/.test(pathname)) return false;
    return pathname === "/organizer/events" || pathname.startsWith("/organizer/events/");
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
export function organizerNavIsActive(pathname: string, href: string): boolean {
  return organizerSidebarNavIsActive(pathname, href);
}

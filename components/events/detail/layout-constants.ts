/** イベント詳細モバイル：ヘッダー行の固定高さ（safe-area 除く） */
export const MOBILE_EVENT_HEADER_ROW_PX = 52;
/** タブ行の高さ（横スクロール・44px タップ） */
export const MOBILE_EVENT_TABS_ROW_PX = 48;
/** 下部固定CTA（イベント詳細）おおよその高さ（padding含む） */
export const MOBILE_EVENT_BOTTOM_ACTION_BAR_PX = 72;
/** モバイル下部ナビを避けるオフセット */
export const MOBILE_BOTTOM_NAV_CLEARANCE_PX = 72;
/** メイン本文の下余白（下部バー＋下部ナビ分。safe-area は別途加算） */
export const MOBILE_EVENT_DETAIL_MAIN_PADDING_BOTTOM_PX =
  MOBILE_EVENT_BOTTOM_ACTION_BAR_PX + MOBILE_BOTTOM_NAV_CLEARANCE_PX;

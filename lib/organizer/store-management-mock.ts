/** 店舗管理画面 Phase1 用モック（DB 未接続） */

export type StorePublishStatus = "public" | "private" | "draft";

export type StoreNewsCategory =
  | "sale"
  | "new_item"
  | "coupon"
  | "business"
  | "stall";

export type StoreNewsStatus = "public" | "ended" | "draft";

export type StoreFeature = {
  id: string;
  label: string;
  icon:
    | "wifi"
    | "terrace"
    | "child"
    | "takeout"
    | "power"
    | "parking"
    | "outdoor_ok"
    | "event_stall"
    | "cashless"
    | "catering";
};

export type StoreGalleryImage = {
  id: string;
  src: string;
  alt: string;
};

export type StoreNewsItem = {
  id: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  category: StoreNewsCategory;
  periodStart: string;
  periodEnd: string | null;
  status: StoreNewsStatus;
  updatedAt: string;
};

export type StoreLinkedEvent = {
  id: string;
  title: string;
  dateLabel: string;
};

export type OrganizerStore = {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  coverImage: string;
  hoursLabel: string;
  publishStatus: StorePublishStatus;
  publishedAt: string;
  updatedAt: string;
  features: StoreFeature[];
  gallery: StoreGalleryImage[];
  galleryExtraCount: number;
  news: StoreNewsItem[];
  linkedEvents: StoreLinkedEvent[];
};

export const STORE_NEWS_CATEGORY_LABEL: Record<StoreNewsCategory, string> = {
  sale: "セール・特売",
  new_item: "新商品・新メニュー",
  coupon: "クーポン",
  business: "営業時報",
  stall: "出店情報",
};

export const DEMO_STORE_ID = "demo-machi-cafe-nerima";

const CAFE_COVER =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1400&q=80";

export const DEMO_ORGANIZER_STORE: OrganizerStore = {
  id: DEMO_STORE_ID,
  name: "まちカフェ練馬",
  category: "カフェ・飲食店",
  tagline: "地域の食材を使った、ほっと一息つけるカフェです。",
  description:
    "練馬の小さなカフェです。地域の農家さんから届く野菜や果物を活かしたメニューを日替わりでご用意しています。仕事の合間にも、ご家族連れにも過ごしやすい空間を目指しています。",
  coverImage: CAFE_COVER,
  hoursLabel: "10:00～18:00",
  publishStatus: "public",
  publishedAt: "2024/05/20",
  updatedAt: "2024/05/20",
  features: [
    { id: "wifi", label: "Wi-Fiあり", icon: "wifi" },
    { id: "terrace", label: "テラス席あり", icon: "terrace" },
    { id: "child", label: "子ども歓迎", icon: "child" },
    { id: "takeout", label: "テイクアウトOK", icon: "takeout" },
  ],
  gallery: [
    {
      id: "g1",
      src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
      alt: "店内の様子",
    },
    {
      id: "g2",
      src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80",
      alt: "パフェ",
    },
    {
      id: "g3",
      src: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80",
      alt: "コーヒー",
    },
    {
      id: "g4",
      src: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&q=80",
      alt: "テラス席",
    },
  ],
  galleryExtraCount: 8,
  news: [
    {
      id: "n1",
      title: "季節のフルーツパフェ 10%OFF！",
      excerpt: "今だけ！旬のフルーツをたっぷり使ったパフェがお得です。",
      thumbnail:
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80",
      category: "sale",
      periodStart: "2024/05/01",
      periodEnd: "2024/05/31",
      status: "public",
      updatedAt: "2024/05/01",
    },
    {
      id: "n2",
      title: "新メニュー「練馬野菜カレー」登場",
      excerpt: "地元農家さんの野菜を使った、やさしい味わいのカレーです。",
      thumbnail:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80",
      category: "new_item",
      periodStart: "2024/04/15",
      periodEnd: null,
      status: "public",
      updatedAt: "2024/04/15",
    },
    {
      id: "n3",
      title: "初回限定！ドリンク1杯無料クーポン",
      excerpt: "アプリからご来店で、お好きなドリンクを1杯プレゼント。",
      thumbnail:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80",
      category: "coupon",
      periodStart: "2024/04/01",
      periodEnd: "2024/06/30",
      status: "public",
      updatedAt: "2024/04/01",
    },
    {
      id: "n4",
      title: "GW期間中の営業時間変更のお知らせ",
      excerpt: "ゴールデンウィーク期間は営業時間を短縮いたします。",
      thumbnail:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80",
      category: "business",
      periodStart: "2024/04/27",
      periodEnd: "2024/05/06",
      status: "ended",
      updatedAt: "2024/04/20",
    },
  ],
  linkedEvents: [
    {
      id: "e1",
      title: "アコースティックライブ",
      dateLabel: "2024/06/08",
    },
  ],
};

export function getOrganizerStoreById(id: string): OrganizerStore | null {
  if (id === DEMO_STORE_ID || id === "demo") {
    return DEMO_ORGANIZER_STORE;
  }
  return null;
}

export function listOrganizerStores(): OrganizerStore[] {
  return [DEMO_ORGANIZER_STORE];
}

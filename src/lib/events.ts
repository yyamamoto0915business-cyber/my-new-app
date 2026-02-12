// 型定義
export type Event = {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  location: string;
  address: string;
  price: number; // 0 = 無料
  priceNote?: string;
  organizerName: string;
  organizerContact?: string;
  rainPolicy?: string; // 雨天時対応
  itemsToBring?: string[]; // 持ち物
  access?: string; // アクセス情報
  createdAt: string;
};

export type EventFormData = Omit<Event, "id" | "createdAt">;

// Mockデータ
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "春のフリーマーケット",
    description:
      "地域住民によるフリーマーケット。掘り出し物が見つかるかも！",
    date: "2025-02-12",
    startTime: "10:00",
    endTime: "15:00",
    location: "中央公園",
    address: "東京都〇〇区〇〇町1-2-3",
    price: 0,
    organizerName: "地域振興会",
    organizerContact: "03-1234-5678",
    rainPolicy: "雨天決行（小雨時）",
    itemsToBring: ["レジャーシート", "飲み物"],
    access: "最寄り駅から徒歩10分",
    createdAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "2",
    title: "親子で楽しむヨガ教室",
    description: "お子様と一緒に楽しめるヨガ体験会です。",
    date: "2025-02-13",
    startTime: "09:00",
    endTime: "10:00",
    location: "市民体育館",
    address: "東京都〇〇区△△町4-5-6",
    price: 500,
    priceNote: "親子1組",
    organizerName: "健康促進サークル",
    rainPolicy: "屋内開催のため雨天関係なし",
    itemsToBring: ["ヨガマット", "動きやすい服装", "タオル"],
    access: "〇〇駅南口より徒歩5分",
    createdAt: "2025-02-05T09:00:00Z",
  },
  {
    id: "3",
    title: "陶芸体験ワークショップ",
    description: "初心者でも気軽に参加できる陶芸体験。自分の茶碗を作りましょう。",
    date: "2025-02-14",
    startTime: "14:00",
    endTime: "16:00",
    location: "工芸館",
    address: "東京都〇〇区◇◇町7-8-9",
    price: 3000,
    priceNote: "材料費込み",
    organizerName: "〇〇陶芸倶楽部",
    rainPolicy: "屋内開催",
    itemsToBring: ["エプロン", "タオル"],
    access: "◇◇駅からバス15分「工芸館前」下車",
    createdAt: "2025-02-08T14:00:00Z",
  },
  {
    id: "4",
    title: "夜の星空観察会",
    description: "天体望遠鏡で月や惑星を観察。専門家が解説します。",
    date: "2025-02-15",
    startTime: "19:00",
    endTime: "21:00",
    location: "展望広場",
    address: "東京都〇〇区☆☆町10-11",
    price: 0,
    organizerName: "天文愛好会",
    rainPolicy: "雨天・曇天時は翌週に延期",
    itemsToBring: ["防寒着", "懐中電灯"],
    access: "☆☆駅から車で20分（駐車場あり）",
    createdAt: "2025-02-03T12:00:00Z",
  },
  {
    id: "5",
    title: "地域カフェ読書会",
    description: "課題本を読んで語り合う読書会。コーヒーを飲みながらゆっくりと。",
    date: "2025-02-16",
    startTime: "13:00",
    endTime: "15:00",
    location: "喫茶ポプラ",
    address: "東京都〇〇区□□町12-13",
    price: 800,
    priceNote: "ドリンク1杯付き",
    organizerName: "読書好きの会",
    rainPolicy: "屋内開催",
    itemsToBring: ["課題本"],
    access: "□□駅西口徒歩2分",
    createdAt: "2025-02-10T08:00:00Z",
  },
  {
    id: "6",
    title: "子ども向け工作教室",
    description: "廃材を使ったエコ工作。小学生向け。",
    date: "2025-02-12",
    startTime: "14:00",
    endTime: "16:00",
    location: "公民館 第2会議室",
    address: "東京都〇〇区××町14-15",
    price: 0,
    organizerName: "こどもサポートNPO",
    rainPolicy: "屋内開催",
    itemsToBring: ["工作用エプロン", "古着（汚れOK）"],
    access: "××駅北口徒歩8分",
    createdAt: "2025-02-07T11:00:00Z",
  },
];

// 取得関数
export function getEvents(): Event[] {
  return mockEvents;
}

export function getEventById(id: string): Event | undefined {
  return mockEvents.find((e) => e.id === id);
}

export function getEventsByOrganizer(organizerName: string): Event[] {
  return mockEvents.filter((e) => e.organizerName === organizerName);
}

// 日付フィルタ用
export function getEventsByDateRange(
  events: Event[],
  range: "today" | "week"
): Event[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (range === "today") {
    return events.filter((e) => e.date === todayStr);
  }

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  return events.filter((e) => e.date >= todayStr && e.date <= weekEndStr);
}

// 料金フィルタ用
export function filterEventsByPrice(
  events: Event[],
  filter: "all" | "free" | "paid"
): Event[] {
  if (filter === "all") return events;
  if (filter === "free") return events.filter((e) => e.price === 0);
  return events.filter((e) => e.price > 0);
}

// 検索用
export function searchEvents(events: Event[], query: string): Event[] {
  if (!query.trim()) return events;
  const q = query.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.organizerName.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
  );
}

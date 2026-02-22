export type EventRequest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  prefecture: string | null;
  city: string | null;
  target_amount: number;
  current_amount: number;
  status: "open" | "funded" | "planned" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type EventRequestSupport = {
  id: string;
  request_id: string;
  user_id: string;
  amount: number;
  message: string | null;
  created_at: string;
};

// モック用（Supabase未設定時）
export const mockEventRequests: (EventRequest & { display_name?: string })[] = [
  {
    id: "er1",
    user_id: "u1",
    title: "秋の収穫祭を開催してほしい",
    description: "地域の農産物を味わえる収穫祭を開催してほしいです。",
    prefecture: "東京都",
    city: "渋谷区",
    target_amount: 50000,
    current_amount: 15000,
    status: "open",
    created_at: "2025-02-10T10:00:00Z",
    updated_at: "2025-02-10T10:00:00Z",
    display_name: "山田さん",
  },
];

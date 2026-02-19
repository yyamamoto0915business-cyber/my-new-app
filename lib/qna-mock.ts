/** Q&A（主催者への質問）モック */

export type QnACategory =
  | "access"
  | "items"
  | "language"
  | "kids"
  | "rain"
  | "other";

export type QnAItem = {
  id: string;
  eventId: string;
  userName: string | null;
  category: QnACategory;
  question: string;
  visibility: "public" | "private";
  answer: string | null;
  answeredAt: string | null;
  pinned: boolean;
  createdAt: string;
};

const qnas = new Map<string, QnAItem[]>();

function uuid() {
  return `qna-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const QNA_CATEGORY_LABELS: Record<QnACategory, string> = {
  access: "アクセス",
  items: "持ち物",
  language: "言語",
  kids: "子供",
  rain: "雨天",
  other: "その他",
};

export function getPublicQnAsByEvent(eventId: string): QnAItem[] {
  const list = qnas.get(eventId) ?? [];
  return list
    .filter((q) => q.visibility === "public" && q.answer)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    .sort((a, b) => new Date(b.answeredAt!).getTime() - new Date(a.answeredAt!).getTime());
}

export function getQnAsByEvent(eventId: string): QnAItem[] {
  const list = qnas.get(eventId) ?? [];
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addQnA(
  eventId: string,
  data: {
    userName?: string | null;
    category: QnACategory;
    question: string;
    visibility: "public" | "private";
  }
): QnAItem {
  const list = qnas.get(eventId) ?? [];
  const item: QnAItem = {
    id: uuid(),
    eventId,
    userName: data.userName ?? null,
    category: data.category,
    question: data.question,
    visibility: data.visibility,
    answer: null,
    answeredAt: null,
    pinned: false,
    createdAt: new Date().toISOString(),
  };
  list.push(item);
  qnas.set(eventId, list);
  return item;
}

export function answerQnA(
  eventId: string,
  qnaId: string,
  answer: string
): QnAItem | null {
  const list = qnas.get(eventId) ?? [];
  const idx = list.findIndex((q) => q.id === qnaId);
  if (idx < 0) return null;
  list[idx].answer = answer;
  list[idx].answeredAt = new Date().toISOString();
  return list[idx];
}

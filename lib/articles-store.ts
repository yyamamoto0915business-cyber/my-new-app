/** 記事の一時ストア（開発用・インメモリ） */
export type Article = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  excerpt: string | null;
  imageUrl: string | null;
  status: "draft" | "published";
  eventId: string | null;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
};

const articles: Article[] = [
  {
    id: "art-1",
    authorId: "author-1",
    authorName: "地域振興会",
    title: "春のフリマに込めた想い",
    body: "地域住民の交流の場として、毎年開催している春のフリーマーケット。今年も多くの方にご参加いただき、ありがとうございました。\n\n掘り出し物を探す楽しみ、知らない人との会話、子どもたちの笑顔。こうした小さな積み重ねが、地域の絆を深めていくのだと実感しています。",
    excerpt: "地域住民の交流の場として、毎年開催している春のフリーマーケット。今年も多くの方にご参加いただき、ありがとうございました。",
    imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
    status: "published",
    eventId: "1",
    likeCount: 12,
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "art-2",
    authorId: "author-2",
    authorName: "参加者",
    title: "陶芸体験に参加して",
    body: "初めての陶芸体験でしたが、先生が丁寧に教えてくれて、思い出に残る茶碗ができました。\n\n自分で作った器でお茶を飲む日が楽しみです。地域のワークショップ、これからも応援します！",
    excerpt: "初めての陶芸体験でしたが、先生が丁寧に教えてくれて、思い出に残る茶碗ができました。",
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
    status: "published",
    eventId: "3",
    likeCount: 8,
    createdAt: "2025-02-08T14:30:00Z",
    updatedAt: "2025-02-08T14:30:00Z",
  },
];

let nextId = 100;

export function getAllArticles(publishedOnly = true): Article[] {
  const list = publishedOnly
    ? articles.filter((a) => a.status === "published")
    : [...articles];
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getArticleById(id: string): Article | null {
  return articles.find((a) => a.id === id) ?? null;
}

export function addArticle(data: Omit<Article, "id" | "createdAt" | "updatedAt" | "likeCount">): Article {
  const id = `art-${nextId++}`;
  const now = new Date().toISOString();
  const article: Article = {
    ...data,
    id,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  articles.push(article);
  return article;
}

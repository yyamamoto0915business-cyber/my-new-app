import type { PostCategory } from "@/lib/posts/mock-feed";

export type DbCommunityPost = {
  id: string;
  author_id: string | null;
  author_display_name: string;
  category: PostCategory;
  title: string;
  body: string;
  area_label: string;
  media_type: "image" | "video";
  media_url: string;
  poster_url: string | null;
  duration_sec: number | null;
  gallery_images: string[];
  status: "draft" | "public" | "hidden";
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateCommunityPostInput = {
  authorId: string | null;
  authorDisplayName: string;
  category: PostCategory;
  title: string;
  body: string;
  areaLabel: string;
  mediaUrl: string;
  galleryImages?: string[];
  posterUrl?: string | null;
  durationSec?: number | null;
  mediaType?: "image" | "video";
  /** 公開状態（既定は公開） */
  status?: "draft" | "public";
};

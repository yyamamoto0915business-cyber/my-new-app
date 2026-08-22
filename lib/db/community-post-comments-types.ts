export type DbCommunityPostComment = {
  id: string;
  post_id: string;
  author_id: string | null;
  author_display_name: string;
  body: string;
  like_count: number;
  status: "public" | "hidden";
  created_at: string;
  updated_at: string;
  /** profiles から付与。DB カラムではない */
  author_avatar_url?: string | null;
};

export type CreateCommunityPostCommentInput = {
  postId: string;
  authorId: string | null;
  authorDisplayName: string;
  body: string;
};

/** 画面表示用に整形したコメント */
export type PostCommentView = {
  id: string;
  authorName: string;
  authorAvatarUrl: string | null;
  body: string;
  likeCount: number;
  postedAtLabel: string;
  createdAt: string;
};

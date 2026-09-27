import type { MyPostItem } from "@/app/api/me/posts/route";

export type SharedAlbumMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: "owner" | "member";
};

export type SharedAlbumSummary = {
  id: string;
  title: string;
  coverUrl: string | null;
  photoCount: number;
  members: SharedAlbumMember[];
  isOwner: boolean;
  blurb?: string | null;
  lead?: string | null;
};

export type SharedAlbumItemView = {
  id: string;
  post: MyPostItem;
  addedBy: SharedAlbumMember;
  caption?: string | null;
  shape?: "tall" | "wide";
};

export type SharedAlbumDetail = SharedAlbumSummary & {
  inviteToken: string;
  items: SharedAlbumItemView[];
};

export type SharedAlbumInvitee = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

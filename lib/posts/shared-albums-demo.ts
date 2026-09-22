import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import type {
  SharedAlbumDetail,
  SharedAlbumInvitee,
  SharedAlbumSummary,
} from "@/lib/posts/shared-album-types";

const YAMA = {
  userId: "demo-yama",
  displayName: "やま",
  avatarUrl: "https://picsum.photos/seed/mg-yama/96/96",
  role: "owner" as const,
};

const SAKI = {
  userId: "preview-sora",
  displayName: "さき",
  avatarUrl: "https://picsum.photos/seed/mg-saki/96/96",
  role: "member" as const,
};

function postsByIds(ids: string[]) {
  return ids
    .map((id) => MY_POSTS_DEMO.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

function album(
  id: string,
  title: string,
  postIds: string[],
  members = [YAMA, SAKI],
): SharedAlbumDetail {
  const posts = postsByIds(postIds);
  return {
    id,
    title,
    coverUrl: posts[0]?.imageUrl ?? null,
    photoCount: posts.length,
    members,
    isOwner: true,
    inviteToken: `demo-${id}`,
    items: posts.map((post, i) => ({
      id: `${id}-item-${post.id}`,
      post,
      addedBy: i % 2 === 0 ? YAMA : SAKI,
    })),
  };
}

export const DEMO_SHARED_ALBUMS: SharedAlbumDetail[] = [
  album("demo-album-spring", "春の散歩", [
    "demo-07-1",
    "demo-08-1",
    "demo-08-5",
    "demo-07-2",
    "demo-08-3",
    "demo-07-3",
  ]),
  album("demo-album-afternoon", "近所の午後", [
    "demo-08-2",
    "demo-07-2",
    "demo-08-3",
    "demo-01-1",
  ]),
];

export const DEMO_ALBUM_INVITEES: SharedAlbumInvitee[] = [
  {
    id: SAKI.userId,
    displayName: SAKI.displayName,
    avatarUrl: SAKI.avatarUrl,
  },
  {
    id: "preview-cafe",
    displayName: "カフェ好き",
    avatarUrl: "https://picsum.photos/seed/mg-follow-preview-cafe/96/96",
  },
  {
    id: "preview-midori",
    displayName: "みどり",
    avatarUrl: "https://picsum.photos/seed/mg-follow-preview-midori/96/96",
  },
];

export function demoAlbumSummaries(): SharedAlbumSummary[] {
  return DEMO_SHARED_ALBUMS.map(({ inviteToken: _t, items: _i, ...rest }) => rest);
}

export function cloneDemoAlbums(): SharedAlbumDetail[] {
  return DEMO_SHARED_ALBUMS.map((album) => ({
    ...album,
    members: album.members.map((m) => ({ ...m })),
    items: album.items.map((item) => ({ ...item, addedBy: { ...item.addedBy } })),
  }));
}

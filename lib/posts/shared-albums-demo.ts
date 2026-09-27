import { MY_POSTS_DEMO } from "@/lib/posts/my-posts-demo";
import type {
  SharedAlbumDetail,
  SharedAlbumInvitee,
  SharedAlbumItemView,
  SharedAlbumMember,
  SharedAlbumSummary,
} from "@/lib/posts/shared-album-types";

const YAMA = {
  userId: "demo-yama",
  displayName: "やま",
  avatarUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&q=80",
  role: "owner" as const,
};

const SAKI = {
  userId: "preview-sora",
  displayName: "さき",
  avatarUrl:
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&q=80",
  role: "member" as const,
};

function postsByIds(ids: string[]) {
  return ids
    .map((id) => MY_POSTS_DEMO.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

const TAKASHI = {
  userId: "demo-takashi",
  displayName: "たかし",
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&q=80",
  role: "member" as const,
};

const YUI = {
  userId: "demo-yui",
  displayName: "ゆい",
  avatarUrl:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&q=80",
  role: "member" as const,
};

const MAI = {
  userId: "demo-mai",
  displayName: "まい",
  avatarUrl:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&q=80",
  role: "member" as const,
};

const KENTO = {
  userId: "demo-kento",
  displayName: "けんと",
  avatarUrl:
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&fit=crop&q=80",
  role: "member" as const,
};

const SPRING_PEOPLE = [YAMA, SAKI, TAKASHI, YUI, MAI, KENTO];

function album(
  id: string,
  title: string,
  postIds: string[],
  blurb: string,
  members = [YAMA, SAKI],
  captions: Array<string | null> = [],
  lead = "みんなで集めた思い出アルバム",
): SharedAlbumDetail {
  const posts = postsByIds(postIds);
  return {
    id,
    title,
    coverUrl: posts[0]?.imageUrl ?? null,
    photoCount: posts.length,
    members,
    isOwner: true,
    blurb,
    lead,
    inviteToken: `demo-${id}`,
    items: posts.map((post, i) => ({
      id: `${id}-item-${post.id}`,
      post,
      addedBy: members[i % members.length] ?? YAMA,
      caption: captions[i] ?? null,
    })),
  };
}

const SPRING_SHOTS: Array<{
  postId: string;
  member: SharedAlbumMember;
  caption: string;
  imageUrl: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  shape: "tall" | "wide";
}> = [
  {
    postId: "demo-04-1",
    member: YAMA,
    caption: "やっと会えた\n満開の桜",
    imageUrl: "/profile/album/spring/sakura-portrait.jpg",
    createdAt: "2026-04-12T10:20:00+09:00",
    likeCount: 12,
    commentCount: 3,
    shape: "tall",
  },
  {
    postId: "demo-07-1",
    member: SAKI,
    caption: "気持ちいい\n春の散歩日和！",
    imageUrl: "/profile/album/spring/walk.jpg",
    createdAt: "2026-04-12T15:10:00+09:00",
    likeCount: 8,
    commentCount: 2,
    shape: "wide",
  },
  {
    postId: "demo-08-2",
    member: TAKASHI,
    caption: "散歩の途中で\n素敵なカフェ発見！",
    imageUrl: "/profile/album/spring/cafe.jpg",
    createdAt: "2026-04-13T11:40:00+09:00",
    likeCount: 15,
    commentCount: 4,
    shape: "wide",
  },
  {
    postId: "demo-05-1",
    member: YUI,
    caption: "きれいな\n菜の花畑",
    imageUrl: "/profile/album/spring/nanohana.jpg",
    createdAt: "2026-04-13T16:05:00+09:00",
    likeCount: 11,
    commentCount: 1,
    shape: "wide",
  },
  {
    postId: "demo-06-1",
    member: MAI,
    caption: "この景色\nずっと残したい",
    imageUrl: "/profile/album/spring/river.jpg",
    createdAt: "2026-04-14T09:30:00+09:00",
    likeCount: 9,
    commentCount: 0,
    shape: "wide",
  },
  {
    postId: "demo-08-4",
    member: KENTO,
    caption: "まちの\n古い町並みも素敵\nまた来たい！",
    imageUrl: "/profile/album/spring/town.jpg",
    createdAt: "2026-04-14T13:20:00+09:00",
    likeCount: 7,
    commentCount: 1,
    shape: "wide",
  },
  {
    postId: "demo-06-3",
    member: YAMA,
    caption: "かわいい\nお花みつけた",
    imageUrl: "/profile/album/spring/flower.jpg",
    createdAt: "2026-04-14T15:50:00+09:00",
    likeCount: 6,
    commentCount: 2,
    shape: "wide",
  },
  {
    postId: "demo-07-4",
    member: SAKI,
    caption: "みんなで見た\n夕焼けが最高だった",
    imageUrl: "/profile/album/spring/sunset.jpg",
    createdAt: "2026-04-14T18:40:00+09:00",
    likeCount: 14,
    commentCount: 3,
    shape: "wide",
  },
];

function springAlbum(): SharedAlbumDetail {
  const items: SharedAlbumItemView[] = SPRING_SHOTS.map((shot) => {
    const base = MY_POSTS_DEMO.find((p) => p.id === shot.postId) ?? MY_POSTS_DEMO[0];
    return {
      id: `demo-album-spring-item-${shot.postId}`,
      addedBy: shot.member,
      caption: shot.caption,
      shape: shot.shape,
      post: {
        ...base,
        imageUrl: shot.imageUrl,
        createdAt: shot.createdAt,
        dateLabel: "2026/4/12",
        likeCount: shot.likeCount,
        commentCount: shot.commentCount,
      },
    };
  });
  return {
    id: "demo-album-spring",
    title: "春の散歩",
    coverUrl: items[0]?.post.imageUrl ?? null,
    photoCount: items.length,
    members: SPRING_PEOPLE,
    isOwner: true,
    blurb: "ぽかぽかの春に見つけたまちの風景たち。",
    lead: "みんなで集めた思い出アルバム🌸",
    inviteToken: "demo-demo-album-spring",
    items,
  };
}

export const DEMO_SHARED_ALBUMS: SharedAlbumDetail[] = [
  springAlbum(),
  album(
    "demo-album-dusk",
    "夕暮れのまち",
    [
      "demo-07-2",
      "demo-08-2",
      "demo-08-3",
      "demo-01-1",
      "demo-08-4",
      "demo-07-4",
      "demo-08-1",
      "demo-07-1",
    ],
    "仕事帰りに撮ったお気に入りの景色。",
    [YAMA],
  ),
  album(
    "demo-album-cafe",
    "カフェ巡り",
    [
      "demo-08-2",
      "demo-07-3",
      "demo-08-3",
      "demo-01-1",
      "demo-08-5",
      "demo-07-2",
      "demo-08-1",
      "demo-07-1",
      "demo-08-4",
      "demo-07-4",
      "demo-06-1",
      "demo-05-1",
    ],
    "まちで出会った素敵なカフェの記録。",
    [YAMA, SAKI],
  ),
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
    items: album.items.map((item) => ({
      ...item,
      addedBy: { ...item.addedBy },
      post: { ...item.post },
    })),
  }));
}

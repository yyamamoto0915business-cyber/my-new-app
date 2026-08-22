export type FollowPreviewPerson = {
  id: string;
  displayName: string;
  avatarUrl: string;
  albumHref: string;
};

function avatar(seed: string) {
  return `https://picsum.photos/seed/mg-follow-${seed}/96/96`;
}

function person(id: string, displayName: string): FollowPreviewPerson {
  return {
    id,
    displayName,
    avatarUrl: avatar(id),
    albumHref: `/users/${id}/album`,
  };
}

export const PREVIEW_FOLLOWERS: FollowPreviewPerson[] = [
  person("preview-sora", "sora_87"),
  person("preview-cafe", "cafe_love"),
  person("preview-midori", "midori_walk"),
  person("preview-yomogi", "よもぎ商店"),
];

export const PREVIEW_FOLLOWING: FollowPreviewPerson[] = [
  person("preview-sora", "sora_87"),
  person("preview-cafe", "cafe_love"),
  person("preview-midori", "midori_walk"),
  person("preview-natsu", "夏の路地"),
  person("preview-umi", "umi_photo"),
];

export function isFollowPreviewUserId(id: string): boolean {
  return id.startsWith("preview-");
}

export function getFollowPreviewPerson(id: string): FollowPreviewPerson | null {
  return (
    [...PREVIEW_FOLLOWERS, ...PREVIEW_FOLLOWING].find((p) => p.id === id) ?? null
  );
}

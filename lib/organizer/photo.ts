export const PHOTO_CATEGORIES = ["観光・まち歩き", "グルメ", "自然・景観", "歴史・文化"] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const PHOTO_THEME_COLORS = [
  { id: "green", label: "みどり", value: "#2d7a4f" },
  { id: "rose", label: "さくら", value: "#d45b78" },
  { id: "sky", label: "そら", value: "#3d7ea6" },
  { id: "gold", label: "こがね", value: "#c08a12" },
] as const;

export const PHOTO_SAMPLE_IMAGES = [
  "/profile/album/spring/sakura.jpg",
  "/profile/album/spring/town.jpg",
  "/profile/album/spring/walk.jpg",
  "/profile/album/spring/river.jpg",
  "/profile/album/spring/cafe.jpg",
  "/profile/album/spring/flower.jpg",
] as const;

export type PhotoSpot = {
  key: string;
  name: string;
  place: string;
  prompt: string;
  imageUrl: string;
  /** その場所に着いたことの確かめ方（ミッション・謎解きと同じ）。 */
  arrival: "none" | "gps" | "keyword";
  lat: number | null;
  lng: number | null;
  radius: number;
  keyword: string;
};

const PHOTO_PLACE_DEFAULTS = { arrival: "gps" as const, lat: null, lng: null, radius: 50, keyword: "" };

export type PhotoSettings = {
  spots: Omit<PhotoSpot, "key">[];
  clearCount: number;
  photoRequired: boolean;
  rewards: {
    points: boolean;
    coupon: boolean;
    prize: boolean;
    couponName: string;
    couponDetail: string;
    prizeName: string;
    prizePlace: string;
  };
  points: number;
  category: string;
  tags: string[];
  mainImage: string;
  coverImage: string;
  themeColor: string;
};

export function createPhotoSpot(): PhotoSpot {
  return {
    key: crypto.randomUUID(),
    name: "",
    place: "",
    prompt: "",
    imageUrl: PHOTO_SAMPLE_IMAGES[0],
    ...PHOTO_PLACE_DEFAULTS,
  };
}

export function samplePhotoSpots(): PhotoSpot[] {
  return [
    {
      key: crypto.randomUUID(),
      name: "中央広場で桜を撮る",
      place: "中央広場",
      prompt: "満開の桜と一緒に、記念写真を撮ろう",
      imageUrl: "/profile/album/spring/sakura.jpg",
      ...PHOTO_PLACE_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      name: "商店街ののれんを撮る",
      place: "さくら商店街",
      prompt: "暖簾や看板など、まちの表情が伝わる一枚を",
      imageUrl: "/profile/album/spring/town.jpg",
      ...PHOTO_PLACE_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      name: "川辺の風景を残す",
      place: "みどりの丘公園",
      prompt: "川と桜並木が写る場所で撮ってみよう",
      imageUrl: "/profile/album/spring/river.jpg",
      ...PHOTO_PLACE_DEFAULTS,
    },
  ];
}

export function sanitizePhotoSettings(raw: unknown): PhotoSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const spots = Array.isArray(body.spots)
    ? body.spots.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        return [
          {
            name: typeof row.name === "string" ? row.name.trim().slice(0, 40) : "",
            place: typeof row.place === "string" ? row.place.trim().slice(0, 40) : "",
            prompt: typeof row.prompt === "string" ? row.prompt.trim().slice(0, 80) : "",
            imageUrl: typeof row.imageUrl === "string" ? row.imageUrl.trim().slice(0, 300) : "",
            arrival: (row.arrival === "keyword" || row.arrival === "none" ? row.arrival : "gps") as PhotoSpot["arrival"],
            lat: typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null,
            lng: typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : null,
            radius: typeof row.radius === "number" ? Math.min(500, Math.max(5, Math.round(row.radius))) : 50,
            keyword: typeof row.keyword === "string" ? row.keyword.trim().slice(0, 40) : "",
          },
        ];
      })
    : [];
  const rewardsRaw =
    body.rewards && typeof body.rewards === "object" ? (body.rewards as Record<string, unknown>) : {};
  const tags = Array.isArray(body.tags)
    ? body.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim().slice(0, 16))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : 1;
  const pointsRaw = typeof body.points === "number" ? Math.round(body.points) : 50;
  const theme =
    typeof body.themeColor === "string" && PHOTO_THEME_COLORS.some((color) => color.value === body.themeColor)
      ? body.themeColor
      : PHOTO_THEME_COLORS[0].value;
  return {
    spots,
    clearCount: Math.min(20, Math.max(1, clearRaw)),
    photoRequired: body.photoRequired !== false,
    rewards: {
      points: rewardsRaw.points === true,
      coupon: rewardsRaw.coupon === true,
      prize: rewardsRaw.prize === true,
      couponName: typeof rewardsRaw.couponName === "string" ? rewardsRaw.couponName.trim().slice(0, 40) : "",
      couponDetail: typeof rewardsRaw.couponDetail === "string" ? rewardsRaw.couponDetail.trim().slice(0, 80) : "",
      prizeName: typeof rewardsRaw.prizeName === "string" ? rewardsRaw.prizeName.trim().slice(0, 40) : "",
      prizePlace: typeof rewardsRaw.prizePlace === "string" ? rewardsRaw.prizePlace.trim().slice(0, 60) : "",
    },
    points: Math.min(9999, Math.max(0, pointsRaw)),
    category: typeof body.category === "string" ? body.category.trim().slice(0, 24) : PHOTO_CATEGORIES[0],
    tags,
    mainImage: typeof body.mainImage === "string" ? body.mainImage.trim().slice(0, 300) : "",
    coverImage: typeof body.coverImage === "string" ? body.coverImage.trim().slice(0, 300) : "",
    themeColor: theme,
  };
}

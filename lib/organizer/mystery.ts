/** その場所に着いたことの確かめ方。none は確かめない（どこからでも解ける）。 */
export type MysteryArrival = "none" | "gps" | "keyword";

export type MysteryStep = {
  key: string;
  place: string;
  prompt: string;
  answer: string;
  hint: string;
  imageUrl: string;
  published: boolean;
  arrival: MysteryArrival;
  lat: number | null;
  lng: number | null;
  /** GPS で開く範囲（m）。 */
  radius: number;
  /** 現地の看板などに書いた合言葉。答えとは別。 */
  keyword: string;
};

const ARRIVAL_DEFAULTS = { arrival: "none" as MysteryArrival, lat: null, lng: null, radius: 50, keyword: "" };

export type MysterySettings = {
  steps: Omit<MysteryStep, "key">[];
  clearCount: number;
  couponOn: boolean;
  prizeOn: boolean;
  couponName: string;
  couponDetail: string;
  prizeName: string;
  prizePlace: string;
};

export function createMysteryStep(): MysteryStep {
  return {
    key: crypto.randomUUID(),
    place: "",
    prompt: "",
    answer: "",
    hint: "",
    imageUrl: "/profile/album/spring/sakura.jpg",
    published: true,
    ...ARRIVAL_DEFAULTS,
  };
}

export function sampleMysterySteps(): MysteryStep[] {
  return [
    {
      key: crypto.randomUUID(),
      place: "さくら通り",
      prompt: "春に、このまちでいちばん先に咲く花は？",
      answer: "桜",
      hint: "ピンクの花です。",
      imageUrl: "/profile/album/spring/sakura.jpg",
      published: true,
      ...ARRIVAL_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      place: "川沿い",
      prompt: "葉の色に近い、川辺の色は？",
      answer: "みどり",
      hint: "若葉の色です。",
      imageUrl: "/profile/album/spring/river.jpg",
      published: true,
      ...ARRIVAL_DEFAULTS,
    },
    {
      key: crypto.randomUUID(),
      place: "茶屋の前",
      prompt: "看板にある、温かい飲み物は？",
      answer: "茶",
      hint: "茶屋の一字です。",
      imageUrl: "/profile/album/spring/cafe.jpg",
      published: true,
      ...ARRIVAL_DEFAULTS,
    },
  ];
}

export function sanitizeMysterySettings(raw: unknown): MysterySettings | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const steps = Array.isArray(body.steps)
    ? body.steps.slice(0, 20).flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        return [
          {
            place: typeof row.place === "string" ? row.place.trim().slice(0, 40) : "",
            prompt: typeof row.prompt === "string" ? row.prompt.trim().slice(0, 120) : "",
            answer: typeof row.answer === "string" ? row.answer.trim().slice(0, 24) : "",
            hint: typeof row.hint === "string" ? row.hint.trim().slice(0, 80) : "",
            imageUrl: typeof row.imageUrl === "string" ? row.imageUrl.trim().slice(0, 300) : "",
            published: row.published !== false,
            arrival: (row.arrival === "gps" || row.arrival === "keyword" ? row.arrival : "none") as MysteryArrival,
            lat: typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null,
            lng: typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : null,
            radius: typeof row.radius === "number" ? Math.min(500, Math.max(5, Math.round(row.radius))) : 50,
            keyword: typeof row.keyword === "string" ? row.keyword.trim().slice(0, 40) : "",
          },
        ];
      })
    : [];
  const clearRaw = typeof body.clearCount === "number" ? Math.round(body.clearCount) : Math.max(steps.length, 1);
  return {
    steps,
    clearCount: Math.min(20, Math.max(1, clearRaw)),
    couponOn: body.couponOn === true,
    prizeOn: body.prizeOn === true,
    couponName: typeof body.couponName === "string" ? body.couponName.trim().slice(0, 40) : "",
    couponDetail: typeof body.couponDetail === "string" ? body.couponDetail.trim().slice(0, 80) : "",
    prizeName: typeof body.prizeName === "string" ? body.prizeName.trim().slice(0, 40) : "",
    prizePlace: typeof body.prizePlace === "string" ? body.prizePlace.trim().slice(0, 60) : "",
  };
}

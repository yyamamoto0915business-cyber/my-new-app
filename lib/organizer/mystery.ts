export type MysteryStep = {
  key: string;
  place: string;
  prompt: string;
  answer: string;
  hint: string;
  imageUrl: string;
  published: boolean;
};

export type MysterySettings = {
  steps: Omit<MysteryStep, "key">[];
  clearCount: number;
  couponOn: boolean;
  prizeOn: boolean;
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
    },
    {
      key: crypto.randomUUID(),
      place: "川沿い",
      prompt: "葉の色に近い、川辺の色は？",
      answer: "みどり",
      hint: "若葉の色です。",
      imageUrl: "/profile/album/spring/river.jpg",
      published: true,
    },
    {
      key: crypto.randomUUID(),
      place: "茶屋の前",
      prompt: "看板にある、温かい飲み物は？",
      answer: "茶",
      hint: "茶屋の一字です。",
      imageUrl: "/profile/album/spring/cafe.jpg",
      published: true,
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
  };
}

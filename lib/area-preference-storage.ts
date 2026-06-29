export const REGION_PREFERENCE_EVENT = "mg:region-preference-updated";

export type RegionPreference = {
  prefecture: string;
  city: string;
  setAsHome: boolean;
};

const AREA_KEY = "mg_area_preference";
const REGION_KEY = "mg_region_preference";

const EMPTY: RegionPreference = {
  prefecture: "",
  city: "",
  setAsHome: true,
};

function parseLegacy(value: string): RegionPreference | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as RegionPreference;
    if (parsed && typeof parsed === "object" && "prefecture" in parsed) {
      return {
        prefecture: parsed.prefecture ?? "",
        city: parsed.city ?? "",
        setAsHome: parsed.setAsHome !== false,
      };
    }
  } catch {
    // legacy plain string (prefecture only)
  }
  return { prefecture: trimmed, city: "", setAsHome: true };
}

export function getRegionPreference(): RegionPreference {
  if (typeof window === "undefined") return { ...EMPTY };

  const json = localStorage.getItem(REGION_KEY);
  if (json) {
    try {
      const parsed = JSON.parse(json) as RegionPreference;
      return {
        prefecture: parsed.prefecture ?? "",
        city: parsed.city ?? "",
        setAsHome: parsed.setAsHome !== false,
      };
    } catch {
      // fall through
    }
  }

  const legacy = localStorage.getItem(AREA_KEY);
  if (legacy) {
    const fromLegacy = parseLegacy(legacy);
    if (fromLegacy) return fromLegacy;
  }

  return { ...EMPTY };
}

/** 表示用ラベル（市区町村があれば併記） */
export function getRegionPreferenceLabel(pref?: RegionPreference): string {
  const p = pref ?? getRegionPreference();
  if (!p.prefecture) return "";
  if (p.city && p.city !== "その他") return `${p.prefecture} ${p.city}`;
  return p.prefecture;
}

/** @deprecated 都道府県のみ返す。新規は getRegionPreference を使用 */
export function getAreaPreference(): string {
  return getRegionPreference().prefecture;
}

export function setRegionPreference(value: RegionPreference): void {
  if (typeof window === "undefined") return;

  const next: RegionPreference = {
    prefecture: value.prefecture.trim(),
    city: value.city.trim(),
    setAsHome: value.setAsHome !== false,
  };

  if (next.prefecture) {
    localStorage.setItem(REGION_KEY, JSON.stringify(next));
    localStorage.setItem(AREA_KEY, next.prefecture);
  } else {
    localStorage.removeItem(REGION_KEY);
    localStorage.removeItem(AREA_KEY);
  }

  window.dispatchEvent(new CustomEvent(REGION_PREFERENCE_EVENT, { detail: next }));
}

/** @deprecated setRegionPreference を使用 */
export function setAreaPreference(value: string): void {
  setRegionPreference({
    prefecture: value.trim(),
    city: "",
    setAsHome: true,
  });
}

export function subscribeRegionPreference(
  listener: (pref: RegionPreference) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<RegionPreference>).detail;
    listener(detail ?? getRegionPreference());
  };
  const onStorage = () => listener(getRegionPreference());

  window.addEventListener(REGION_PREFERENCE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(REGION_PREFERENCE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

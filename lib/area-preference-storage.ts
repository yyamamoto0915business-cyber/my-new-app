const AREA_KEY = "mg_area_preference";

export function getAreaPreference(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(AREA_KEY) ?? "";
}

export function setAreaPreference(value: string): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(AREA_KEY, value);
  } else {
    localStorage.removeItem(AREA_KEY);
  }
}

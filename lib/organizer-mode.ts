/** 主催者モード（localStorage mg:organizerMode） */

const KEY = "mg:organizerMode";

export function getOrganizerMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function setOrganizerMode(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, on ? "true" : "false");
    window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: on ? "true" : "false" }));
  } catch {
    // ignore
  }
}

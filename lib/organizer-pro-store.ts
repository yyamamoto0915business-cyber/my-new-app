"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "mg:organizer-pro";

let _isPro = false;
const _listeners = new Set<() => void>();
let _hydratedFromStorage = false;

function persistOrganizerPro(value: boolean) {
  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    }
  } catch {
    /* private mode / quota */
  }
}

/** true if _isPro changed */
function hydrateFromStorageOnce(): boolean {
  if (typeof window === "undefined" || _hydratedFromStorage) return false;
  _hydratedFromStorage = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === "1") {
      if (!_isPro) {
        _isPro = true;
        return true;
      }
      return false;
    }
    if (raw === "0") {
      if (_isPro) {
        _isPro = false;
        return true;
      }
      return false;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function setOrganizerPro(value: boolean) {
  if (_isPro === value) return;
  _isPro = value;
  persistOrganizerPro(value);
  _listeners.forEach((fn) => fn());
}

function subscribe(callback: () => void) {
  _listeners.add(callback);
  if (hydrateFromStorageOnce()) {
    _listeners.forEach((fn) => fn());
  }
  return () => {
    _listeners.delete(callback);
  };
}

const getSnapshot = () => _isPro;
const getServerSnapshot = () => false;

export function useOrganizerPro(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

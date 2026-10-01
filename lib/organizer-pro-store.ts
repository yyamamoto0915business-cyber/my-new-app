"use client";

import { useSyncExternalStore } from "react";
import type { OrganizerCatalogPlanId } from "@/lib/organizer-plans";

const LEGACY_KEY = "mg:organizer-pro";
const PLAN_KEY = "mg:organizer-nav-plan";

let _plan: OrganizerCatalogPlanId | null = null;
let _isPro = false;
const _listeners = new Set<() => void>();
let _hydratedFromStorage = false;

function isPlanId(value: string | null): value is OrganizerCatalogPlanId {
  return value === "free" || value === "standard" || value === "game" || value === "team";
}

function isPaidPlan(plan: OrganizerCatalogPlanId | null): boolean {
  return plan === "standard" || plan === "game" || plan === "team";
}

function persistPlan(plan: OrganizerCatalogPlanId | null) {
  try {
    if (typeof window === "undefined") return;
    if (plan) {
      sessionStorage.setItem(PLAN_KEY, plan);
    } else {
      sessionStorage.removeItem(PLAN_KEY);
    }
    sessionStorage.setItem(LEGACY_KEY, isPaidPlan(plan) ? "1" : "0");
  } catch {
    /* private mode / quota */
  }
}

function readStoredPlan(): OrganizerCatalogPlanId | null {
  try {
    const raw = sessionStorage.getItem(PLAN_KEY);
    if (isPlanId(raw)) return raw;
    if (sessionStorage.getItem(LEGACY_KEY) === "1") return "standard";
  } catch {
    /* ignore */
  }
  return null;
}

/** true if the snapshot changed */
function hydrateFromStorageOnce(): boolean {
  if (typeof window === "undefined" || _hydratedFromStorage) return false;
  _hydratedFromStorage = true;
  const plan = readStoredPlan();
  const nextPro = isPaidPlan(plan);
  if (_plan === plan && _isPro === nextPro) return false;
  _plan = plan;
  _isPro = nextPro;
  return true;
}

function emit() {
  _listeners.forEach((fn) => fn());
}

export function setOrganizerNavPlan(plan: OrganizerCatalogPlanId | null) {
  const nextPro = isPaidPlan(plan);
  if (_plan === plan && _isPro === nextPro) return;
  _plan = plan;
  _isPro = nextPro;
  persistPlan(plan);
  emit();
}

/** 互換: true は STANDARD。false は主催者未登録扱いでバッジを出さない */
export function setOrganizerPro(value: boolean) {
  setOrganizerNavPlan(value ? "standard" : null);
}

function subscribe(callback: () => void) {
  _listeners.add(callback);
  if (hydrateFromStorageOnce()) emit();
  return () => {
    _listeners.delete(callback);
  };
}

export function useOrganizerNavPlan(): OrganizerCatalogPlanId | null {
  return useSyncExternalStore(
    subscribe,
    () => _plan,
    () => null
  );
}

export function useOrganizerPro(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => _isPro,
    () => false
  );
}

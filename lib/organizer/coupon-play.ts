import { safeImageUrl } from "@/lib/organizer/game-experience";
import { sanitizeCouponSettings, type CouponWinMode } from "@/lib/organizer/coupon";

export type PublicCouponStore = {
  index: number;
  name: string;
  category: string;
  imageUrl: string;
  offer: string;
  condition: string;
};

export type PublicCouponPlay = {
  needed: number;
  autoGrant: boolean;
  noStack: boolean;
  stores: PublicCouponStore[];
};

function couponImage(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw.startsWith("/") && !raw.includes("..") && !raw.includes("\\")) return raw.slice(0, 300);
  return safeImageUrl(raw, 300);
}

function neededCount(mode: CouponWinMode, winCount: number, storeCount: number): number {
  if (storeCount <= 0) return 1;
  if (mode === "all") return storeCount;
  return Math.min(Math.max(winCount, 1), storeCount);
}

export function readStoredCoupon(settings: unknown): PublicCouponPlay | null {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const coupon = sanitizeCouponSettings((settings as { coupon?: unknown }).coupon);
  if (!coupon) return null;
  const stores = coupon.stores.flatMap((store) => {
    if (!store.published || !store.name) return [];
    return [
      {
        name: store.name,
        category: store.category,
        imageUrl: couponImage(store.imageUrl),
        offer: store.offer,
        condition: store.condition,
      },
    ];
  });
  if (stores.length === 0) return null;
  return {
    needed: neededCount(coupon.winMode, coupon.winCount, stores.length),
    autoGrant: coupon.autoGrant,
    noStack: coupon.noStack,
    stores: stores.map((store, index) => ({ ...store, index })),
  };
}

export function readPublicCoupon(raw: unknown): PublicCouponPlay | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const body = raw as Record<string, unknown>;
  const stores = Array.isArray(body.stores)
    ? body.stores.flatMap((item): PublicCouponStore[] => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const name = typeof row.name === "string" ? row.name.trim() : "";
        const index = typeof row.index === "number" ? Math.round(row.index) : -1;
        if (!name || index < 0) return [];
        return [
          {
            index,
            name,
            category: typeof row.category === "string" ? row.category : "",
            imageUrl: couponImage(row.imageUrl),
            offer: typeof row.offer === "string" ? row.offer : "",
            condition: typeof row.condition === "string" ? row.condition : "",
          },
        ];
      })
    : [];
  if (stores.length === 0) return null;
  const neededRaw = typeof body.needed === "number" ? Math.round(body.needed) : stores.length;
  return {
    needed: Math.min(stores.length, Math.max(1, neededRaw)),
    autoGrant: body.autoGrant !== false,
    noStack: body.noStack !== false,
    stores,
  };
}

export function normalizeCouponDone(value: unknown, total: number): number[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<number>();
  for (const item of value) {
    if (typeof item !== "number" || !Number.isInteger(item)) continue;
    if (item < 0 || item >= total) continue;
    set.add(item);
  }
  return [...set].sort((left, right) => left - right);
}

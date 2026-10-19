import {
  BedDouble,
  Bike,
  Bus,
  Camera,
  Landmark,
  Mountain,
  PartyPopper,
  ShoppingBag,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { spotIconCategory, type GameSpotCategory, type GameSpotIcon } from "@/lib/organizer/game-experience";
import type { PlaySpotProgress } from "@/lib/organizer/play-types";

/** 素材シートの見出しと同じ色。 */
export const SPOT_CATEGORY_LOOK: Record<GameSpotCategory, { color: string; soft: string; Icon: LucideIcon }> = {
  food: { color: "#ef5a6a", soft: "#fde6e8", Icon: UtensilsCrossed },
  shop: { color: "#3b82f6", soft: "#e3edfe", Icon: ShoppingBag },
  sightseeing: { color: "#2f9e5a", soft: "#e2f4e8", Icon: Camera },
  culture: { color: "#a0663a", soft: "#f6ebe1", Icon: Landmark },
  event: { color: "#8b5cf6", soft: "#efe9fe", Icon: PartyPopper },
  stamp: { color: "#ec5f8c", soft: "#fde7ef", Icon: Star },
  stay: { color: "#0f8a7a", soft: "#ddf3ef", Icon: BedDouble },
  nature: { color: "#f59e0b", soft: "#fef1d9", Icon: Mountain },
  sports: { color: "#3aa04a", soft: "#e3f4e4", Icon: Bike },
  transport: { color: "#6b7280", soft: "#eceef1", Icon: Bus },
};

export function spotIcon(spot: Pick<PlaySpotProgress, "icon">): GameSpotIcon {
  return spot.icon ?? "stamp";
}

export function spotCategory(spot: Pick<PlaySpotProgress, "icon">): GameSpotCategory {
  return spotIconCategory(spot.icon);
}

export function spotIconUrl(spot: Pick<PlaySpotProgress, "icon">): string {
  return `/play/spots/${spotIcon(spot)}.webp`;
}

const NATURE_ICONS: GameSpotIcon[] = ["park", "lake", "hiking", "playground", "river"];
const CATEGORY_MARKER: Record<GameSpotCategory, string> = {
  food: "food",
  shop: "shop",
  sightseeing: "sightseeing",
  culture: "culture",
  event: "event",
  stamp: "stamp",
  stay: "stay",
  nature: "park",
  sports: "other",
  transport: "other",
};

/** 地図に立てるマーカー（public/play/markers）。神社・お寺、キッチンカー、公園まわりは専用の形。 */
export function spotMarkerUrl(spot: Pick<PlaySpotProgress, "icon">): string {
  const icon = spotIcon(spot);
  const name =
    icon === "shrine" || icon === "temple"
      ? "shrine"
      : icon === "kitchen-car"
        ? "kitchen-car"
        : NATURE_ICONS.includes(icon)
          ? "park"
          : CATEGORY_MARKER[spotCategory(spot)];
  return `/play/markers/${name}.png`;
}

/** 種類の小さな札。マップのカードとスポット詳細で使う。 */
export function SpotCategoryTag({ category, label }: { category: GameSpotCategory; label: string }) {
  const look = SPOT_CATEGORY_LOOK[category];
  return (
    <span className="rally-tag" style={{ color: look.color, background: look.soft }}>
      {label}
    </span>
  );
}

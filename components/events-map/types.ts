import type { Event } from "@/lib/db/types";

export type EventWithDistance = Event & { distanceKm?: number };

export type MapBoundsState = {
  north: number;
  south: number;
  west: number;
  east: number;
  centerLat: number;
  centerLng: number;
  zoom: number;
};


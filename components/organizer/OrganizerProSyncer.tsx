"use client";

import { useEffect } from "react";
import { setOrganizerPro } from "@/lib/organizer-pro-store";

export function OrganizerProSyncer({ isPro }: { isPro: boolean }) {
  useEffect(() => {
    setOrganizerPro(isPro);
  }, [isPro]);
  return null;
}

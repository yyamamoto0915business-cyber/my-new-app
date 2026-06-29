"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRegionPreference,
  getRegionPreferenceLabel,
  subscribeRegionPreference,
  type RegionPreference,
} from "@/lib/area-preference-storage";

const EMPTY_PREFERENCE: RegionPreference = {
  prefecture: "",
  city: "",
  setAsHome: true,
};

export function useRegionPreference() {
  const [preference, setPreference] = useState<RegionPreference>(EMPTY_PREFERENCE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreference(getRegionPreference());
    setHydrated(true);
    return subscribeRegionPreference(setPreference);
  }, []);

  const label = hydrated ? getRegionPreferenceLabel(preference) : "";

  const refresh = useCallback(() => {
    setPreference(getRegionPreference());
  }, []);

  return { preference, label, refresh, hydrated };
}

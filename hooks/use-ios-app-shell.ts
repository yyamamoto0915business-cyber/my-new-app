"use client";

import { useEffect, useState } from "react";
import { isIosAppShell } from "@/lib/native/app-shell";

/** マウント後に iOS アプリ内かを返す。ブラウザでは false のまま。 */
export function useIosAppShell(): boolean {
  const [iosApp, setIosApp] = useState(false);
  useEffect(() => {
    setIosApp(isIosAppShell());
  }, []);
  return iosApp;
}

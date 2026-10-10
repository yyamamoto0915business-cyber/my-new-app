import type { ReactNode } from "react";
import { PlayLocaleSwitch } from "@/components/play/PlayLocaleSwitch";

export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="play-game-shell">
      <PlayLocaleSwitch />
      {children}
    </div>
  );
}

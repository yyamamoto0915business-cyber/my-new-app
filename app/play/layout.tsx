import type { ReactNode } from "react";

export default function PlayLayout({ children }: { children: ReactNode }) {
  return <div className="play-game-shell">{children}</div>;
}

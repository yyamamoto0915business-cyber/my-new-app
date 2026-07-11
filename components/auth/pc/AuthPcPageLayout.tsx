import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/** PC グローバルナビ（サイドバー w-20 + 上部バー）の直下にぴったり収める 2 カラム */
export function AuthPcPageLayout({ children, className }: Props) {
  return (
    <div
      data-auth-pc-layout
      className={cn(
        "relative isolate flex h-full w-full overflow-hidden bg-[#f3f4f1]",
        className
      )}
    >
      {children}
    </div>
  );
}

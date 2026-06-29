"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function EventsLayoutBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEventDetail = /^\/events\/[^/]+$/.test(pathname ?? "");

  return (
    <div className="relative z-10 min-h-screen min-w-0">
      <div
        className={cn(
          "min-h-screen",
          isEventDetail ? "min-[900px]:bg-[var(--mg-paper)]" : "min-[900px]:bg-[#F5F8F5]"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EventsLayoutBody>{children}</EventsLayoutBody>;
}

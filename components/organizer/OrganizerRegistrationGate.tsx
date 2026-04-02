"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type GateState = "loading" | "registered" | "unregistered";

export function OrganizerRegistrationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GateState>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/organizer/registration-status", {
          cache: "no-store",
        });
        const json = (await res.json()) as { registered?: boolean };
        const registered = !!json?.registered;

        if (cancelled) return;

        if (!registered) {
          setState("unregistered");
          const next = encodeURIComponent(pathname || "/organizer");
          router.replace(`/organizer?next=${next}`);
          return;
        }

        setState("registered");
      } catch {
        if (!cancelled) {
          setState("unregistered");
          const next = encodeURIComponent(pathname || "/organizer");
          router.replace(`/organizer?next=${next}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (state !== "registered") {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-slate-500">確認中...</p>
      </div>
    );
  }

  return <>{children}</>;
}


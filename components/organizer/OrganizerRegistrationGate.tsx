"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAbortLikeError } from "@/lib/is-abort-like-error";

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
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/organizer/registration-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = (await res.json()) as { registered?: boolean };
        const registered = !!json?.registered;

        if (controller.signal.aborted) return;

        if (!registered) {
          setState("unregistered");
          const next = encodeURIComponent(pathname || "/organizer");
          router.replace(`/organizer?next=${next}`);
          return;
        }

        setState("registered");
      } catch (err) {
        if (controller.signal.aborted || isAbortLikeError(err)) return;
        setState("unregistered");
        const next = encodeURIComponent(pathname || "/organizer");
        router.replace(`/organizer?next=${next}`);
      }
    })();

    return () => {
      controller.abort();
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


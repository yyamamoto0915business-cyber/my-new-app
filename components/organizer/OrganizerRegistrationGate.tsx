"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isAbortLikeError } from "@/lib/is-abort-like-error";

type GateState = "loading" | "registered" | "unregistered" | "error";

/**
 * 主催者の画面の外枠（app/organizer/layout.tsx）がサーバーで確かめた「登録済みか」。
 * 登録済みと分かっていれば、ページを移るたびに確かめ直さない（「確認中...」が毎回出て遅く感じていた）。
 */
const OrganizerRegisteredContext = createContext(false);

export function OrganizerRegisteredProvider({ registered, children }: { registered: boolean; children: React.ReactNode }) {
  return <OrganizerRegisteredContext.Provider value={registered}>{children}</OrganizerRegisteredContext.Provider>;
}

const STATUS_TIMEOUT_MS = 6000;

/**
 * 主催者登録済みか確認する。
 * router を effect 依存に入れない（毎レンダーで effect が再起動し、確認中のまま固まるため）。
 */
export function OrganizerRegistrationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const knownRegistered = useContext(OrganizerRegisteredContext);
  const [state, setState] = useState<GateState>(knownRegistered ? "registered" : "loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (knownRegistered) return;
    let cancelled = false;
    let timedOut = false;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, STATUS_TIMEOUT_MS);

    (async () => {
      try {
        const res = await fetch("/api/organizer/registration-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = (await res.json()) as { registered?: boolean };
        if (cancelled) return;

        if (!json?.registered) {
          setState("unregistered");
          const next = encodeURIComponent(pathname || "/organizer");
          routerRef.current.replace(`/organizer?next=${next}`);
          return;
        }

        setState("registered");
      } catch (err) {
        if (cancelled) return;
        if (isAbortLikeError(err) || controller.signal.aborted) {
          if (timedOut) setState("error");
          return;
        }
        setState("error");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [pathname, retryKey, knownRegistered]);

  if (state === "registered") {
    return <>{children}</>;
  }

  if (state === "error") {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-slate-600">
          主催者情報の確認に失敗しました。
        </p>
        <button
          type="button"
          className="rounded-lg bg-[#2D7A4F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#245f3e]"
          onClick={() => {
            setState("loading");
            setRetryKey((k) => k + 1);
          }}
        >
          再試行
        </button>
      </div>
    );
  }

  if (state === "unregistered") {
    const next = encodeURIComponent(pathname || "/organizer");
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-slate-600">主催者登録へ移動しています…</p>
        <Link
          href={`/organizer?next=${next}`}
          className="text-[13px] font-semibold text-[#2D7A4F] underline"
        >
          開かない場合はこちら
        </Link>
      </div>
    );
  }

  // 確かめているあいだは、文字ではなく画面の形だけを薄く出す
  return (
    <div className="space-y-3 pt-2 motion-safe:animate-pulse" aria-busy aria-label="読み込み中">
      <div className="h-6 w-40 rounded-lg bg-[#e6ece6]" />
      <div className="h-16 rounded-2xl border border-[#e8ede8] bg-white" />
      <div className="h-24 rounded-2xl border border-[#e8ede8] bg-white" />
    </div>
  );
}

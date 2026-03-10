"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 認証入口は /auth に統一 */
export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const returnTo = params.get("returnTo") ?? params.get("redirect") ?? params.get("callbackUrl");
    const url = new URL("/auth", window.location.origin);
    if (returnTo) url.searchParams.set("next", returnTo);
    router.replace(url.pathname + url.search);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FFFCF7] via-white to-[#F8FAFC]">
      <p className="text-sm text-slate-500">読み込み中...</p>
    </div>
  );
}

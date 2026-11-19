"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requiresAuth } from "@/lib/auth-utils";

/**
 * スマホのログイン画面の上の帯：ログインせずに見て回れる所へ戻る入口。
 * 前は、ログインしていないときにマイページなどを押してこの画面に来ると、まちの情報・みんなの投稿へ戻れなかった。
 */
export function AuthMobileExitBar() {
  const router = useRouter();

  const goBack = () => {
    // 直前の画面がログインなしで見られる所なら戻る（ログインが要る画面に戻ると、またこの画面に来てしまう）
    try {
      if (document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin && !ref.pathname.startsWith("/auth") && !requiresAuth(ref.pathname)) {
          router.back();
          return;
        }
      }
    } catch {
      /* 戻り先が分からないときは、まちの情報へ */
    }
    if (window.history.length > 1 && !document.referrer) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <div className="relative z-[11] flex items-center justify-between gap-2 px-3 pb-1 pt-2 min-[900px]:hidden">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-white/85 px-3 text-[13px] font-bold text-[#2a5540] shadow-[0_2px_8px_rgba(42,85,64,0.12)] backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        もどる
      </button>
      <div className="flex items-center gap-1.5">
        <Link
          href="/"
          className="inline-flex min-h-[40px] items-center rounded-full bg-white/85 px-3 text-[12.5px] font-bold text-[#2a5540] shadow-[0_2px_8px_rgba(42,85,64,0.12)] backdrop-blur"
        >
          まちの情報
        </Link>
        <Link
          href="/posts"
          className="inline-flex min-h-[40px] items-center rounded-full bg-white/85 px-3 text-[12.5px] font-bold text-[#2a5540] shadow-[0_2px_8px_rgba(42,85,64,0.12)] backdrop-blur"
        >
          みんなの投稿
        </Link>
      </div>
    </div>
  );
}

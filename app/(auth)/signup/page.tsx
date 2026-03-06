"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 新規登録は /auth?tab=signup で表示 */
export default function SignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth?tab=signup");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
      <p className="text-sm text-[var(--mg-muted)]">読み込み中...</p>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 確認メール再送は /auth/check-email に統一（email なしでアクセス時はログイン画面から再度登録を案内） */
export default function ResendConfirmationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/check-email");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
      <p className="text-sm text-[var(--mg-muted)]">読み込み中...</p>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** パスワード再設定は /auth/reset-password に統一 */
export default function ForgotPasswordRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/reset-password");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--mg-paper)]">
      <p className="text-sm text-[var(--mg-muted)]">読み込み中...</p>
    </div>
  );
}

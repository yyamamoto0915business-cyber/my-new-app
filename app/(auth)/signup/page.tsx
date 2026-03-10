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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#FFFCF7] via-white to-[#F8FAFC]">
      <p className="text-sm text-slate-500">読み込み中...</p>
    </div>
  );
}

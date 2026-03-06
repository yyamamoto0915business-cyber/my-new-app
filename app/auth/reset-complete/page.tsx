"use client";

import Link from "next/link";
import { AuthResultScreen, authResultButtonClass } from "@/components/auth/auth-result-screen";

export default function ResetCompletePage() {
  return (
    <AuthResultScreen
      icon="check"
      title="パスワードを更新しました"
      description="新しいパスワードでログインできます。"
    >
      <Link href="/auth" className={authResultButtonClass.primary}>
        ログインへ進む
      </Link>
    </AuthResultScreen>
  );
}

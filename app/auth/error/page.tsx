"use client";

import Link from "next/link";
import { AuthResultScreen, authResultButtonClass } from "@/components/auth/auth-result-screen";

export default function AuthErrorPage() {
  return (
    <AuthResultScreen
      icon="alert"
      title="確認リンクを開けませんでした"
      description="リンクの有効期限が切れているか、URLが正しくない可能性があります。"
      note="もう一度確認メールを送ると、最新のリンクを受け取れます。"
    >
      <Link href="/auth/check-email" className={authResultButtonClass.primary}>
        確認メールを再送する
      </Link>
      <Link href="/auth?tab=signup" className={authResultButtonClass.secondary}>
        新規登録に戻る
      </Link>
    </AuthResultScreen>
  );
}

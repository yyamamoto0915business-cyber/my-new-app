"use client";

import Link from "next/link";
import { AuthResultScreen, authResultButtonClass } from "@/components/auth/auth-result-screen";

export default function VerifiedPage() {
  return (
    <AuthResultScreen
      icon="check"
      title="登録が完了しました"
      description="メールアドレスの確認が完了しました。MachiGlyphをはじめましょう。"
    >
      <Link href="/" className={authResultButtonClass.primary}>
        ホームへ進む
      </Link>
      <Link href="/organizer/events" className={authResultButtonClass.secondary}>
        イベントを主催する
      </Link>
      <Link href="/profile" className={authResultButtonClass.secondary}>
        マイページへ進む
      </Link>
    </AuthResultScreen>
  );
}

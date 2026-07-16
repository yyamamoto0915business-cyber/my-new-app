"use client";

import Link from "next/link";
import { AuthResultScreen, authResultButtonClass } from "@/components/auth/auth-result-screen";

export default function VerifiedPage() {
  return (
    <AuthResultScreen
      icon="check"
      title="登録が完了しました"
      description="メールアドレスの確認が完了しました。つづいて使い方を選び、プロフィールを整えましょう。"
    >
      <Link href="/" className={authResultButtonClass.primary}>
        はじめる
      </Link>
      <Link href="/events" className={authResultButtonClass.secondary}>
        まずはイベントを見る
      </Link>
    </AuthResultScreen>
  );
}

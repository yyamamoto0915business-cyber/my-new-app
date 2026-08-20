import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  /** Developer プランの無料枠を使い切らないよう、トレースは 10% のみ送る（エラー自体はサンプリング対象外で常に送信される） */
  tracesSampleRate: 0.1,
  debug: false,
});

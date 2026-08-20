import * as Sentry from "@sentry/nextjs";

/** middleware（proxy）など Edge ランタイムで動く処理用 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});

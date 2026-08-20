import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});

/** App Router のクライアント遷移をトレースに含める */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

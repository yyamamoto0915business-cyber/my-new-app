import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Server Components / Server Actions / Route Handlers で投げられたエラーを捕捉する */
export const onRequestError = Sentry.captureRequestError;

import type { NextRequest } from "next/server";
import { getAppUrl } from "@/lib/stripe";

/**
 * Connect の refresh/return URL 用の公開オリジン。
 * 本番ではリクエストの Host を優先し、常に https（localhost 以外）。
 */
export function getPublicOriginForStripeRedirect(request: NextRequest): string {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (!host) {
    return getAppUrl();
  }
  const hostname = host.includes(":") && !host.startsWith("[") ? host.split(":")[0]! : host;
  const isLocal =
    /^localhost$/i.test(hostname) || /^127\.0\.0\.1$/i.test(hostname) || /^\[::1\]$/i.test(hostname);
  if (isLocal) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase() === "https"
        ? "https"
        : "http";
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  return `https://${host}`.replace(/\/$/, "");
}

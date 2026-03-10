/**
 * 管理画面 API の DTO とレスポンスヘルパー
 */

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type ApiErrorResponse = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function ok<T>(data: T): ApiSuccessResponse<T> {
  return { ok: true, data };
}

export function err(
  code: ApiErrorCode,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return { ok: false, error: { code, message, details } };
}

// 補助ラベル
export function planStatusLabel(
  effectivePlan: string,
  manualGrantActive: boolean,
  isExpired: boolean
): string {
  if (isExpired && manualGrantActive) return "期限切れ";
  if (manualGrantActive) return "手動付与中";
  if (effectivePlan === "free") return "無料プラン";
  if (effectivePlan !== "free") return "有料利用中";
  return "無料プラン";
}

export function billingStatusLabel(billingSource: string): string {
  if (billingSource === "manual") return "手動付与";
  if (billingSource === "stripe") return "Stripe課金中";
  if (billingSource === "campaign") return "キャンペーン";
  return "無料";
}

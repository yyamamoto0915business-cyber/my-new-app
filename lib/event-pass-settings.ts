/** 他画面から参照するだけの開催・詳細情報 */
export type EventPassSourceData = {
  price: number;
  capacity: number | null;
  applicationDeadline: string | null;
};

/** 参加パス設定画面で保存するデータ */
export type EventPassSettings = {
  applicationType: "none" | "required";
  paymentMethod: "online" | "onsite" | "both" | null;
  checkInMethod: "qr" | "manual" | null;
};

export type EventPassPaymentMethod = NonNullable<EventPassSettings["paymentMethod"]>;
export type EventPassCheckInMethod = NonNullable<EventPassSettings["checkInMethod"]>;

export function normalizePaymentMethod(
  value: unknown
): EventPassSettings["paymentMethod"] {
  if (value === "online" || value === "onsite" || value === "both") return value;
  return null;
}

export function normalizeCheckInMethod(
  value: unknown
): EventPassSettings["checkInMethod"] {
  if (value === "qr" || value === "manual") return value;
  return null;
}

export function applicationTypeFromParticipationMode(
  mode: "required" | "optional" | "none" | null | undefined
): EventPassSettings["applicationType"] {
  return mode === "required" || mode === "optional" ? "required" : "none";
}

export function participationModeFromApplicationType(
  type: EventPassSettings["applicationType"]
): "required" | "none" {
  return type === "required" ? "required" : "none";
}

export function formatPassPrice(price: number): string {
  if (price <= 0) return "無料";
  return `${price.toLocaleString("ja-JP")}円`;
}

export function formatPassCapacity(capacity: number | null | undefined): string {
  if (capacity == null) return "無制限";
  return `${capacity}名`;
}

export function formatPassDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "未設定";
  try {
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return "未設定";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "未設定";
  }
}

export function applicationTypeLabel(
  type: EventPassSettings["applicationType"] | null | undefined
): string {
  if (type === "required") return "参加申込みあり";
  if (type === "none") return "申込不要";
  return "未設定";
}

export function paymentMethodLabel(
  method: EventPassSettings["paymentMethod"]
): string {
  switch (method) {
    case "online":
      return "オンラインで事前決済";
    case "onsite":
      return "現地で支払い";
    case "both":
      return "オンライン・現地どちらも";
    default:
      return "未設定";
  }
}

export function paymentMethodShortLabel(
  method: EventPassSettings["paymentMethod"]
): string {
  switch (method) {
    case "online":
      return "オンライン事前決済";
    case "onsite":
      return "現地支払い";
    case "both":
      return "オンライン・現地";
    default:
      return "未設定";
  }
}

export function checkInMethodLabel(
  method: EventPassSettings["checkInMethod"]
): string {
  switch (method) {
    case "qr":
      return "QRコードで受付";
    case "manual":
      return "主催者が手動で受付";
    default:
      return "未設定";
  }
}

export function checkInMethodShortLabel(
  method: EventPassSettings["checkInMethod"]
): string {
  switch (method) {
    case "qr":
      return "QRコード受付";
    case "manual":
      return "手動受付";
    default:
      return "未設定";
  }
}

/** 詳細情報カード用の要約行 */
export function buildPassSettingSummaryLines(input: {
  passConfigured?: boolean;
  applicationType: EventPassSettings["applicationType"];
  paymentMethod: EventPassSettings["paymentMethod"];
  checkInMethod: EventPassSettings["checkInMethod"];
  price: number;
}): string[] {
  if (!input.passConfigured) return [];

  if (input.applicationType === "none") {
    return ["申込不要", "参加パスは発行しません"];
  }

  if (input.price <= 0) {
    const lines = ["無料参加パス"];
    if (input.checkInMethod) {
      lines.push(checkInMethodShortLabel(input.checkInMethod));
    }
    return lines;
  }

  const lines = ["有料参加パス"];
  if (input.paymentMethod) {
    lines.push(paymentMethodShortLabel(input.paymentMethod));
  }
  if (input.checkInMethod) {
    lines.push(checkInMethodShortLabel(input.checkInMethod));
  }
  return lines;
}

export type PassSettingsValidation = {
  ok: boolean;
  errors: Partial<Record<"applicationType" | "paymentMethod" | "checkInMethod", string>>;
  stripeWarning: boolean;
};

export function validatePassSettings(
  settings: EventPassSettings,
  price: number,
  stripeReady: boolean
): PassSettingsValidation {
  const errors: PassSettingsValidation["errors"] = {};

  if (settings.applicationType === "required") {
    if (!settings.checkInMethod) {
      errors.checkInMethod = "当日の受付方法を選んでください";
    }
    if (price >= 1 && !settings.paymentMethod) {
      errors.paymentMethod = "支払い方法を選んでください";
    }
  }

  const needsStripe =
    settings.applicationType === "required" &&
    price >= 1 &&
    (settings.paymentMethod === "online" || settings.paymentMethod === "both");

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    stripeWarning: needsStripe && !stripeReady,
  };
}

export function normalizePassSettingsForSave(
  settings: EventPassSettings,
  price: number
): EventPassSettings {
  if (settings.applicationType === "none") {
    return {
      applicationType: "none",
      paymentMethod: null,
      checkInMethod: settings.checkInMethod,
    };
  }
  return {
    applicationType: "required",
    paymentMethod: price >= 1 ? settings.paymentMethod : null,
    checkInMethod: settings.checkInMethod,
  };
}

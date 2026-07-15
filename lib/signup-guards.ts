/**
 * 新規登録のスパム／ボット対策（サーバー側検証）。
 * フォーム経路と、将来の API 経路の両方から再利用できる純関数群。
 */

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/** Gmail ローカル部のドット過多（古典的な一斉登録パターン） */
const GMAIL_MAX_DOTS = 2;

/** 表示名の最大長 */
export const DISPLAY_NAME_MAX_LENGTH = 40;

/**
 * ボットが流し込むランダム英数字表示名（例: GxEoBqiJghoxWJuWbolsuc）
 * - 空白なしの英字のみ
 * - 14文字以上
 * - 大文字・小文字が混在
 */
const RANDOM_DISPLAY_NAME_RE = /^[A-Za-z]{14,40}$/;

export type SignupGuardFailure = {
  ok: false;
  message: string;
};

export type SignupGuardSuccess = { ok: true };

export function validateSignupEmail(email: string): SignupGuardFailure | SignupGuardSuccess {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false, message: "メールアドレスの形式が正しくありません。" };
  }

  const at = normalized.lastIndexOf("@");
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  if (!local || !domain || local.length > 64 || domain.length > 255) {
    return { ok: false, message: "メールアドレスの形式が正しくありません。" };
  }

  if (GMAIL_DOMAINS.has(domain)) {
    const dotCount = (local.match(/\./g) ?? []).length;
    if (dotCount > GMAIL_MAX_DOTS) {
      return {
        ok: false,
        message: "このメールアドレスでは登録できません。別のアドレスをお試しください。",
      };
    }
  }

  return { ok: true };
}

export function validateSignupDisplayName(
  displayName: string | undefined
): SignupGuardFailure | SignupGuardSuccess {
  const name = (displayName ?? "").trim();
  if (!name) return { ok: true };

  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `表示名は${DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください。`,
    };
  }

  if (RANDOM_DISPLAY_NAME_RE.test(name) && /[a-z]/.test(name) && /[A-Z]/.test(name)) {
    return {
      ok: false,
      message: "表示名の形式が正しくありません。別の表示名をお試しください。",
    };
  }

  return { ok: true };
}

/**
 * ハニーポット: 画面に見えない欄。ボットが埋めたら拒否。
 * 人間には空のまま送信される想定。
 */
export function validateSignupHoneypot(
  honeypot: string | undefined
): SignupGuardFailure | SignupGuardSuccess {
  if (honeypot != null && String(honeypot).trim() !== "") {
    return { ok: false, message: "エラーが発生しました。しばらくしてからもう一度お試しください。" };
  }
  return { ok: true };
}

export function validateSignupAgreed(
  agreedToTerms: boolean | undefined
): SignupGuardFailure | SignupGuardSuccess {
  if (!agreedToTerms) {
    return { ok: false, message: "利用規約とプライバシーポリシーへの同意が必要です。" };
  }
  return { ok: true };
}

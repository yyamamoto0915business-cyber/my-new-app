import { auth } from "@/auth";

const DEV_USER = {
  id: "dev-user",
  email: "dev@local",
  name: "開発ユーザー",
  role: "volunteer" as const,
};

function isAuthDisabled(): boolean {
  return (
    process.env.AUTH_DISABLED === "true" ||
    (process.env.NODE_ENV === "development" && process.env.AUTH_DISABLED !== "false")
  );
}

/**
 * 認証セッション取得。AUTH_DISABLED 時は開発用モックユーザーを返す。
 */
export async function getAuth() {
  if (isAuthDisabled()) {
    return {
      user: {
        id: DEV_USER.id,
        email: DEV_USER.email,
        name: DEV_USER.name,
        role: DEV_USER.role,
      },
      expires: "2099-12-31",
    };
  }
  return auth();
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** クリア対象の localStorage / sessionStorage キー（主催者・認証関連） */
const ORGANIZER_STORAGE_KEYS = [
  "user",
  "profile",
  "role",
  "organizer",
  "organizer_profile",
  "access_token",
  "refresh_token",
  "profile-dashboard-tab",
];

function clearOrganizerStorage() {
  if (typeof window === "undefined") return;
  ORGANIZER_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

type Variant = "header" | "subnav";

type Props = {
  /** ボタンスタイル（header=ヘッダー用、subnav=サブナビピル用） */
  variant?: Variant;
};

/** 主催者ログアウトボタン（Supabase signOut → /login へ遷移） */
function OrganizerLogoutButton({ variant = "header" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase not configured");
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      clearOrganizerStorage();
      router.replace("/login");
      router.refresh();
    } catch {
      alert("ログアウトに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const baseClass =
    "min-h-[44px] rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:ring-red-700";

  if (variant === "subnav") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="ログアウト"
        className={`shrink-0 bg-white dark:bg-zinc-900/50 ${baseClass}`}
      >
        {loading ? "ログアウト中..." : "ログアウト"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="ログアウト"
      className={`inline-flex items-center justify-center bg-white dark:bg-zinc-900/50 ${baseClass}`}
    >
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}

export { OrganizerLogoutButton };
export default OrganizerLogoutButton;

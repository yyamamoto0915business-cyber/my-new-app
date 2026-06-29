"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { isPaidOrganizer } from "@/lib/billing";
import { setOrganizerPro } from "@/lib/organizer-pro-store";

type BillingJson = {
  organizer?: {
    subscription_status?: string | null;
    stripe_status?: string | null;
    manual_grant_active?: boolean | null;
    manual_grant_expires_at?: string | null;
  };
};

/** ホームなど主催レイアウト外でも有料フラグを保持する（トップナビの PRO 表示用） */
export function OrganizerProGlobalSyncer() {
  const pathname = usePathname() ?? "";
  const { user, loading } = useSupabaseUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setOrganizerPro(false);
      return;
    }

    /** 主催レイアウト側の OrganizerProSyncer（サーバー真値）を優先。billing が遅延・差分で後から false が乗らないようにする */
    if (pathname.startsWith("/organizer")) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/organizer/billing", {
          credentials: "same-origin",
        });
        if (cancelled) return;

        /** 認証ずれや一時503では既存の PRO 表示を壊さない（主催レイアウト・sessionStorage の真と整合） */
        if (res.status === 403) {
          setOrganizerPro(false);
          return;
        }
        if (!res.ok) {
          return;
        }

        let data: BillingJson;
        try {
          data = (await res.json()) as BillingJson;
        } catch {
          return;
        }
        const o = data.organizer;
        if (!o) {
          setOrganizerPro(false);
          return;
        }
        setOrganizerPro(isPaidOrganizer(o));
      } catch {
        /* network等: 上書きしない */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, loading, pathname]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import type { OrganizerRole } from "@/lib/organizer/team";

/** 主催者としての役割（オーナー・管理者・編集者・スタッフ）。読み込み中は undefined、主催者でなければ null */
let cache: Promise<OrganizerRole | null> | null = null;

function loadRole(): Promise<OrganizerRole | null> {
  if (!cache) {
    cache = fetch("/api/organizer/registration-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { registered?: boolean; role?: OrganizerRole | null }) => (j.registered ? (j.role ?? "owner") : null))
      .catch(() => {
        cache = null;
        return null;
      });
  }
  return cache;
}

export function useOrganizerRole(): OrganizerRole | null | undefined {
  const [role, setRole] = useState<OrganizerRole | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void loadRole().then((r) => {
      if (alive) setRole(r);
    });
    return () => {
      alive = false;
    };
  }, []);
  return role;
}
